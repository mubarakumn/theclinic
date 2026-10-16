// controllers/radiologyController.js
import RadiologyOrder from '../models/RadiologyOrder.js';
import Patient from '../models/Patient.js';

export const getRadiologyOrders = async (req, res) => {
  try {
    const orders = await RadiologyOrder.find({ tenantId: req.user.tenantId })
      .populate({ path: 'patientId', match: { tenantId: req.tenantId }, select: 'firstName lastName patientId' })
      .populate({ path: 'doctorId', match: { tenantId: req.tenantId }, select: 'firstName lastName' })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching radiology orders', error: error.message });
  }
};

export const createRadiologyOrder = async (req, res) => {
  try {
    const { patientId, scanType, bodyPart, price, clinicalNotes } = req.body;
    const patient = await Patient.findOne({ _id: patientId, tenantId: req.tenantId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const order = await RadiologyOrder.create({
      tenantId: req.tenantId,
      patientId,
      doctorId: req.user._id,
      scanType,
      bodyPart,
      price,
      clinicalNotes,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating radiology order', error: error.message });
  }
};

export const updateRadiologyReport = async (req, res) => {
  try {
    const { findings } = req.body;
    if (typeof findings !== 'string' || !findings.trim()) {
      return res.status(400).json({ success: false, message: 'Non-empty report findings are required' });
    }
    const order = await RadiologyOrder.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { findings, status: 'COMPLETED' },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: 'Radiology order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating radiology report', error: error.message });
  }
};