// controllers/radiologyController.js
import RadiologyOrder from '../models/RadiologyOrder.js';
import Patient from '../models/Patient.js';
import ServicePrice from '../models/ServicePrice.js';
import mongoose from 'mongoose';

export const getRadiologyOrders = async (req, res) => {
  try {
    const orders = await RadiologyOrder.find({ tenantId: req.tenantId })
      .populate({ path: 'patientId', match: { tenantId: req.tenantId }, select: 'firstName lastName patientId dateOfBirth gender' })
      .populate({ path: 'doctorId', match: { tenantId: req.tenantId }, select: 'firstName lastName' })
      .populate({ path: 'reportedById', match: { tenantId: req.tenantId }, select: 'firstName lastName' })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Get Radiology Orders Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching radiology orders', error: error.message });
  }
};

export const createRadiologyOrder = async (req, res) => {
  try {
    const { patientId, servicePriceId, bodyPart, clinicalNotes } = req.body;
    if (
      typeof patientId !== 'string' ||
      !patientId.trim() ||
      !mongoose.Types.ObjectId.isValid(patientId) ||
      typeof servicePriceId !== 'string' ||
      !mongoose.Types.ObjectId.isValid(servicePriceId) ||
      typeof bodyPart !== 'string' ||
      !bodyPart.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Patient, active radiology tariff, and body part are required',
      });
    }

    const [patient, servicePrice] = await Promise.all([
      Patient.findOne({ _id: patientId, tenantId: req.tenantId }),
      ServicePrice.findOne({
        _id: servicePriceId,
        tenantId: req.tenantId,
        category: 'RADIOLOGY',
        isActive: true,
      }),
    ]);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    if (!servicePrice) {
      return res.status(400).json({ success: false, message: 'Select an active radiology tariff from the service price list' });
    }

    const order = await RadiologyOrder.create({
      tenantId: req.tenantId,
      patientId: patient._id,
      doctorId: req.user._id,
      servicePriceId: servicePrice._id,
      scanType: servicePrice.serviceName,
      bodyPart: bodyPart.trim(),
      price: servicePrice.price,
      clinicalNotes: typeof clinicalNotes === 'string' ? clinicalNotes.trim() : '',
    });

    await order.populate([
      { path: 'patientId', match: { tenantId: req.tenantId }, select: 'firstName lastName patientId dateOfBirth gender' },
      { path: 'doctorId', match: { tenantId: req.tenantId }, select: 'firstName lastName' },
    ]);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create Radiology Order Error:', error);
    res.status(500).json({ success: false, message: 'Error creating radiology order', error: error.message });
  }
};

export const updateRadiologyReport = async (req, res) => {
  try {
    const { findings, complete = true } = req.body;
    if (typeof findings !== 'string' || !findings.trim()) {
      return res.status(400).json({ success: false, message: 'Non-empty report findings are required' });
    }
    if (typeof complete !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Report completion must be true or false' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid radiology order ID' });
    }

    const update = {
      findings: findings.trim(),
      status: complete ? 'COMPLETED' : 'IN_PROGRESS',
    };
    if (complete) {
      update.reportedById = req.user._id;
      update.reportCompletedAt = new Date();
    }

    const order = await RadiologyOrder.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, status: { $in: ['PENDING', 'IN_PROGRESS'] } },
      update,
      { new: true }
    )
      .populate({ path: 'patientId', match: { tenantId: req.tenantId }, select: 'firstName lastName patientId dateOfBirth gender' })
      .populate({ path: 'doctorId', match: { tenantId: req.tenantId }, select: 'firstName lastName' })
      .populate({ path: 'reportedById', match: { tenantId: req.tenantId }, select: 'firstName lastName' });

    if (!order) {
      const existingOrder = await RadiologyOrder.exists({ _id: req.params.id, tenantId: req.tenantId });
      if (existingOrder) {
        return res.status(409).json({ success: false, message: 'This radiology report has already been completed' });
      }
      return res.status(404).json({ success: false, message: 'Radiology order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Update Radiology Report Error:', error);
    res.status(500).json({ success: false, message: 'Error updating radiology report', error: error.message });
  }
};