// controllers/labController.js
import LabOrder from '../models/LabOrder.js';
import Patient from '../models/Patient.js';

export const getLabOrders = async (req, res) => {
  try {
    const orders = await LabOrder.find({ tenantId: req.user.tenantId })
      .populate({ path: 'patientId', match: { tenantId: req.tenantId }, select: 'firstName lastName patientId' })
      .populate({ path: 'doctorId', match: { tenantId: req.tenantId }, select: 'firstName lastName' })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching lab orders', error: error.message });
  }
};

export const createLabOrder = async (req, res) => {
  try {
    const { patientId, testName, testCode, price } = req.body;
    const patient = await Patient.findOne({ _id: patientId, tenantId: req.tenantId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const order = await LabOrder.create({
      tenantId: req.tenantId,
      patientId,
      doctorId: req.user._id,
      testName,
      testCode,
      price,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating lab order', error: error.message });
  }
};

export const updateLabResult = async (req, res) => {
  try {
    const { results, notes } = req.body;
    if (typeof results !== 'string' || !results.trim()) {
      return res.status(400).json({ success: false, message: 'A non-empty lab result is required' });
    }
    const order = await LabOrder.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { results, notes, status: 'COMPLETED' },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: 'Lab order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating lab results', error: error.message });
  }
};