import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';

const populateFields = (tenantId) => [
  { path: 'patientId', match: { tenantId }, select: 'firstName lastName patientId' },
  { path: 'doctorId', match: { tenantId }, select: 'firstName lastName' },
];

export const createPrescription = async (req, res) => {
  try {
    const { patientId, medicationName, dosage, quantity, unitPrice = 0 } = req.body;
    if (!patientId || !medicationName || !dosage || !Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Patient, medication, dosage, and a positive quantity are required',
      });
    }

    const patient = await Patient.findOne({ _id: patientId, tenantId: req.user.tenantId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const price = Number(unitPrice);
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Unit price must be a non-negative number' });
    }

    const prescription = await Prescription.create({
      tenantId: req.user.tenantId,
      patientId,
      doctorId: req.user._id,
      medicationName,
      dosage,
      quantity: Number(quantity),
      unitPrice: price,
      totalPrice: Number(quantity) * price,
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
