import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import ServicePrice from '../models/ServicePrice.js';
import mongoose from 'mongoose';

const populateFields = (tenantId) => [
  { path: 'patientId', match: { tenantId }, select: 'firstName lastName patientId' },
  { path: 'doctorId', match: { tenantId }, select: 'firstName lastName' },
];

export const createPrescription = async (req, res) => {
  try {
    const { patientId, servicePriceId, dosage, quantity } = req.body;
    if (
      !mongoose.Types.ObjectId.isValid(patientId) ||
      !mongoose.Types.ObjectId.isValid(servicePriceId) ||
      typeof dosage !== 'string' ||
      !dosage.trim() ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Patient, pharmacy tariff, dosage, and a positive whole-number quantity are required',
      });
    }

    const [patient, servicePrice] = await Promise.all([
      Patient.findOne({ _id: patientId, tenantId: req.tenantId }),
      ServicePrice.findOne({
        _id: servicePriceId,
        tenantId: req.tenantId,
        category: 'PHARMACY',
        isActive: true,
      }),
    ]);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    if (!servicePrice) {
      return res.status(400).json({ success: false, message: 'Select an active pharmacy tariff from the service price list' });
    }

    const prescription = await Prescription.create({
      tenantId: req.tenantId,
      patientId: patient._id,
      doctorId: req.user._id,
      servicePriceId: servicePrice._id,
      medicationName: servicePrice.serviceName,
      dosage: dosage.trim(),
      quantity: Number(quantity),
      unitPrice: servicePrice.price,
      totalPrice: Number(quantity) * servicePrice.price,
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription: await prescription.populate(populateFields(req.tenantId)),
    });
  } catch (error) {
    console.error('Create Prescription Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const query = { tenantId: req.user.tenantId };
    if (req.query.patientId) query.patientId = req.query.patientId;
    if (req.query.status) query.status = req.query.status;

    const prescriptions = await Prescription.find(query)
      .populate(populateFields(req.tenantId))
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, prescriptions });
  } catch (error) {
    console.error('Get Prescriptions Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prescriptions' });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    }).populate(populateFields(req.tenantId));
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found' });
    res.status(200).json({ success: true, prescription });
  } catch (error) {
    console.error('Get Prescription Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prescription' });
  }
};

export const dispensePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.user.tenantId,
        status: 'PRESCRIBED',
      },
      { status: 'DISPENSED' },
      { new: true, runValidators: true },
    ).populate(populateFields(req.tenantId));

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found or it is no longer awaiting dispensing',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription dispensed successfully',
      prescription,
    });
  } catch (error) {
    console.error('Dispense Prescription Error:', error);
    res.status(500).json({ success: false, message: 'Failed to dispense prescription' });
  }
};

export const cancelPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.user.tenantId,
        status: 'PRESCRIBED',
      },
      { status: 'CANCELLED' },
      { new: true, runValidators: true },
    ).populate(populateFields(req.tenantId));

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found or it can no longer be cancelled',
      });
    }

    res.status(200).json({ success: true, message: 'Prescription cancelled successfully', prescription });
  } catch (error) {
    console.error('Cancel Prescription Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel prescription' });
  }
};
