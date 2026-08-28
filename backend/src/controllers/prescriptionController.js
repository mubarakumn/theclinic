import mongoose from "mongoose";
import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import InventoryItem from "../models/InventoryItem.js";
import Invoice from "../models/Invoice.js";

const populateFields = [
  { path: "patient", select: "patientId firstName lastName" },
  { path: "doctor", select: "name" },
  { path: "appointment", select: "appointmentDate reason" }, // Will be null if not provided
  { path: "dispensedBy", select: "name" },
  { path: "invoice", select: "invoiceNumber total" },
  { path: "medications.item", select: "name unit" },
];

/**
 * @desc    Create a new prescription
 * @route   POST /api/prescriptions
 * @access  Private (doctor)
 */
export const createPrescription = async (req, res) => {
  const { patient, appointment, medications } = req.body;

  if (
    !patient ||
    !medications ||
    !Array.isArray(medications) ||
    medications.length === 0
  ) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Patient, appointment, and at least one medication are required",
      });
  }

  try {
    const patientExists = await Patient.findOne({
      _id: patient,
      isActive: true,
    });
    if (!patientExists) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found or is inactive" });
    }

    // Verify all medication items exist in inventory
    const itemIds = medications.map((med) => med.item);
    const foundItems = await InventoryItem.find({ _id: { $in: itemIds }, isActive: true }).select('_id');
    if (foundItems.length !== itemIds.length) {
      const foundItemIds = new Set(
        foundItems.map((item) => item._id.toString()),
      );
      const missingItemIds = itemIds.filter((id) => !foundItemIds.has(id));
      return res.status(400).json({
        success: false,
        message: `One or more medication items are invalid or inactive: ${missingItemIds.join(", ")}`,
      });
    }

    const prescription = await Prescription.create({
      patient,
      appointment,
      doctor: req.user._id,
      medications,
    });

    // Remove createdBy as it's redundant with the 'doctor' field
    // createdBy: req.user._id,

    const populatedPrescription = await prescription.populate(populateFields);
    res
      .status(201)
      .json({
        success: true,
        message: "Prescription created successfully",
        prescription: populatedPrescription,
      });
  } catch (error) {
    console.error("Create Prescription Error:", error);
    res
      .status(400)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * @desc    Get all prescriptions (paginated)
 * @route   GET /api/prescriptions
 * @access  Private (doctor, pharmacist, admin, super_admin)
 */
export const getPrescriptions = async (req, res) => {
  try {
    const { patient, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (patient) query.patient = patient;
    if (status) query.status = status;

    let pageNum = parseInt(page, 10);
    let limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(limitNum) || limitNum < 1) limitNum = 20;
    limitNum = Math.min(limitNum, 100);
    const skip = (pageNum - 1) * limitNum;

    const total = await Prescription.countDocuments(query);
    const prescriptions = await Prescription.find(query)
      .populate(populateFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      prescriptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Prescriptions Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Get a single prescription by ID
 * @route   GET /api/prescriptions/:id
 * @access  Private (doctor, pharmacist, admin, super_admin)
 */
export const getPrescriptionById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid prescription ID" });
  }
  try {
    const prescription = await Prescription.findById(req.params.id).populate(
      populateFields,
    );
    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription not found" });
    }
    res.status(200).json({ success: true, prescription });
  } catch (error) {
    console.error("Get Prescription Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Dispense a prescription
 * @route   POST /api/prescriptions/:id/dispense
 * @access  Private (pharmacist)
 */
export const dispensePrescription = async (req, res) => {
  const { id: prescriptionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid prescription ID" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const prescription =
      await Prescription.findById(prescriptionId).session(session);

    if (!prescription) {
      throw new Error("Prescription not found.");
    }
    if (prescription.status !== "Pending") {
      throw new Error(
        `Cannot dispense a prescription with status: ${prescription.status}.`,
      );
    }

    const invoiceItems = [];

    // Check stock and prepare inventory updates and invoice items
    for (const med of prescription.medications) {
      // Atomically find and update the inventory item
      const inventoryItem = await InventoryItem.findOneAndUpdate(
        { _id: med.item, quantity: { $gte: med.quantity } }, // Condition to prevent overselling
        { $inc: { quantity: -med.quantity } }, // Atomic decrement
        { new: true, session },
      );

      if (!inventoryItem) {
        const failedItem = await InventoryItem.findById(med.item).select(
          "name",
        );
        throw new Error(
          `Insufficient stock for item: ${failedItem ? failedItem.name : med.item}.`,
        );
      }

      if (
        inventoryItem.unitPrice === undefined ||
        inventoryItem.unitPrice < 0
      ) {
        throw new Error(
          `Price not set for inventory item: ${inventoryItem.name}`,
        );
      }

      // Add to invoice items
      invoiceItems.push({
        description: `${inventoryItem.name} (${med.dosage})`,
        quantity: med.quantity,
        unitPrice: inventoryItem.unitPrice,
        total: med.quantity * inventoryItem.unitPrice,
      });
    }

    // Create an invoice for the dispensed medications
    const subtotal = invoiceItems.reduce((acc, item) => acc + item.total, 0);
    const invoice = new Invoice({
      patient: prescription.patient,
      appointment: prescription.appointment,
      items: invoiceItems,
      subtotal: subtotal,
      total: subtotal, // Assuming no tax/discount for simplicity here
      balance: subtotal,
      status: "Issued",
      createdBy: req.user._id,
    });
    await invoice.save({ session });

    // Update the prescription status
    prescription.status = "Dispensed";
    prescription.dispensedBy = req.user._id;
    prescription.dispensedAt = new Date();
    prescription.invoice = invoice._id;
    await prescription.save({ session });

    await session.commitTransaction();

    const populatedPrescription = await Prescription.findById(
      prescription._id,
    ).populate(populateFields);

    res.status(200).json({
      success: true,
      message: "Prescription dispensed and invoice created successfully.",
      prescription: populatedPrescription,
      invoice,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Dispense Prescription Error:", error);
    res
      .status(400)
      .json({ success: false, message: error.message || "Server Error" });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Cancel a prescription
 * @route   PATCH /api/prescriptions/:id/status
 * @access  Private (doctor, admin, super_admin)
 */
export const cancelPrescription = async (req, res) => {
  const { id: prescriptionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid prescription ID" });
  }

  try {
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription not found" });
    }

    if (prescription.status !== "Pending") {
      return res
        .status(400)
        .json({
          success: false,
          message: `Cannot cancel a prescription that is already ${prescription.status.toLowerCase()}.`,
        });
    }

    prescription.status = "Cancelled";
    await prescription.save();

    const populatedPrescription = await prescription.populate(populateFields);
    res
      .status(200)
      .json({
        success: true,
        message: "Prescription cancelled successfully",
        prescription: populatedPrescription,
      });
  } catch (error) {
    console.error("Cancel Prescription Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
