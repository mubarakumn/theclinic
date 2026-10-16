import mongoose from "mongoose";
import Bed from "../models/Bed.js";
import Patient from "../models/Patient.js";

const populateFields = (tenantId) => [
  { path: "currentPatient", match: { tenantId }, select: "patientId firstName lastName" },
];

/**
 * @desc    Create a new bed
 * @route   POST /api/beds
 * @access  Private (super_admin, admin)
 */
export const createBed = async (req, res) => {
  const { wardName, bedNumber } = req.body;

  if (!wardName || !bedNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Ward name and bed number are required" });
  }

  try {
    const bed = await Bed.create({ tenantId: req.user.tenantId, wardName, bedNumber });
    res
      .status(201)
      .json({ success: true, message: "Bed created successfully", bed });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A bed with this ward name and bed number already exists",
      });
    }
    console.error("Create Bed Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Get all beds
 * @route   GET /api/beds
 * @access  Private (All authenticated staff)
 */
export const getBeds = async (req, res) => {
  try {
    const { ward, isOccupied, page = 1, limit = 20 } = req.query;
    const query = { tenantId: req.user.tenantId };

    if (ward) query.wardName = { $regex: ward, $options: "i" };
    if (isOccupied !== undefined) query.isOccupied = isOccupied === "true";

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid pagination parameters" });
    }

    const skip = (pageNum - 1) * limitNum;
    const total = await Bed.countDocuments(query);
    const beds = await Bed.find(query)
      .populate(populateFields(req.tenantId))
      .sort({ wardName: 1, bedNumber: 1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      beds,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Beds Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Get a single bed by ID
 * @route   GET /api/beds/:id
 * @access  Private (All authenticated staff)
 */
export const getBedById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid bed ID" });
  }
  try {
    const bed = await Bed.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate(populateFields(req.tenantId));
    if (!bed) {
      return res.status(404).json({ success: false, message: "Bed not found" });
    }
    res.status(200).json({ success: true, bed });
  } catch (error) {
    console.error("Get Bed Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Update a bed's details
 * @route   PATCH /api/beds/:id
 * @access  Private (super_admin, admin)
 */
export const updateBed = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid bed ID" });
  }

  // Prevent patient assignment fields from being updated here
  if (req.body.isOccupied !== undefined || req.body.currentPatient) {
    return res.status(400).json({
      success: false,
      message: "Use the assign/release endpoints to manage bed occupancy",
    });
  }

  try {
    const updates = {};
    if (req.body.wardName) updates.wardName = req.body.wardName;
    if (req.body.bedNumber) updates.bedNumber = req.body.bedNumber;

    const updatedBed = await Bed.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedBed) {
      return res.status(404).json({ success: false, message: "Bed not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bed updated successfully",
      bed: updatedBed,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A bed with this ward name and bed number already exists",
      });
    }
    console.error("Update Bed Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Assign a patient to a bed
 * @route   POST /api/beds/:id/assign
 * @access  Private (doctor, nurse, admin, super_admin)
 */
export const assignPatientToBed = async (req, res) => {
  const { patientId } = req.body;
  const { id: bedId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bedId) || !mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({ success: false, message: "Invalid bed or patient ID" });
  }

  try {
    const bed = await Bed.findOne({ _id: bedId, tenantId: req.user.tenantId });
    if (!bed) {
      return res.status(404).json({ success: false, message: "Bed not found" });
    }
    if (bed.isOccupied) {
      return res.status(409).json({ success: false, message: "Bed is already occupied" });
    }

    const patient = await Patient.findOne({ _id: patientId, tenantId: req.user.tenantId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found or is inactive" });
    }

    bed.isOccupied = true;
    bed.currentPatient = patientId;
    await bed.save();

    const populatedBed = await bed.populate(populateFields(req.tenantId));

    res.status(200).json({
      success: true,
      message: "Patient assigned to bed successfully",
      bed: populatedBed,
    });
  } catch (error) {
    console.error("Assign Patient to Bed Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Release a patient from a bed
 * @route   POST /api/beds/:id/release
 * @access  Private (doctor, nurse, admin, super_admin)
 */
export const releaseBed = async (req, res) => {
  const { id: bedId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bedId)) {
    return res.status(400).json({ success: false, message: "Invalid bed ID" });
  }

  try {
    const bed = await Bed.findOne({ _id: bedId, tenantId: req.user.tenantId });
    if (!bed) {
      return res.status(404).json({ success: false, message: "Bed not found" });
    }
    if (!bed.isOccupied) {
      return res.status(400).json({ success: false, message: "Bed is already vacant" });
    }

    bed.isOccupied = false;
    bed.currentPatient = null;
    await bed.save();

    res.status(200).json({
      success: true,
      message: "Bed released successfully",
      bed,
    });
  } catch (error) {
    console.error("Release Bed Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};