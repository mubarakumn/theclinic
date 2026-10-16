import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import LabOrder from '../models/LabOrder.js';
import RadiologyOrder from '../models/RadiologyOrder.js';
import Prescription from '../models/Prescription.js';
import Invoice from '../models/Invoice.js';
import AntenatalRecord from '../models/AntenatalRecord.js';
import Bed from '../models/Bed.js';
import getNextSequence from '../utils/getNextSequence.js';
import { logAction } from '../utils/auditLogger.js';

const roleSets = {
  clinical: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'],
  laboratory: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'LAB_TECH'],
  radiology: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RADIOLOGIST'],
  pharmacy: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'PHARMACIST'],
  billing: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'ACCOUNTANT'],
  admissions: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'NURSE'],
  antenatal: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'],
};

const canView = (role, section) => roleSets[section].includes(role);

export const getPatients = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { tenantId: req.user.tenantId };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { physicalCardNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching patients', error: error.message });
  }
};

export const getPatientFolder = async (req, res) => {
  try {
    const patientIdQuery = [{ patientId: req.params.id }];
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      patientIdQuery.push({ _id: req.params.id });
    }

    const patient = await Patient.findOne({
      tenantId: req.tenantId,
      $or: patientIdQuery,
    }).lean();

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const role = req.user.role;
    const tenantId = req.tenantId;
    const patientId = patient._id;
    const access = Object.fromEntries(
      Object.keys(roleSets).map((section) => [section, canView(role, section)]),
    );

    const [
      medicalRecords,
      labOrders,
      radiologyOrders,
      prescriptions,
      invoices,
      antenatalRecords,
      admissions,
    ] = await Promise.all([
      access.clinical
        ? MedicalRecord.find({ tenantId, patientId })
            .populate({ path: 'doctorId', match: { tenantId }, select: 'firstName lastName' })
            .sort({ createdAt: -1 }).lean()
        : [],
      access.laboratory
        ? LabOrder.find({ tenantId, patientId })
            .populate({ path: 'doctorId', match: { tenantId }, select: 'firstName lastName' })
            .sort({ createdAt: -1 }).lean()
        : [],
      access.radiology
        ? RadiologyOrder.find({ tenantId, patientId })
            .populate({ path: 'doctorId', match: { tenantId }, select: 'firstName lastName' })
            .sort({ createdAt: -1 }).lean()
        : [],
      access.pharmacy
        ? Prescription.find({ tenantId, patientId })
            .populate({ path: 'doctorId', match: { tenantId }, select: 'firstName lastName' })
            .sort({ createdAt: -1 }).lean()
        : [],
      access.billing
        ? Invoice.find({ tenantId, patientId }).sort({ createdAt: -1 }).lean()
        : [],
      access.antenatal
        ? AntenatalRecord.find({ tenantId, patientId }).sort({ createdAt: -1 }).lean()
        : [],
      access.admissions
        ? Bed.find({ tenantId, currentPatient: patientId, isOccupied: true })
            .sort({ updatedAt: -1 }).lean()
        : [],
    ]);

    return res.status(200).json({
      success: true,
      data: {
        patient,
        access,
        canManagePhysicalCard: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(role),
        medicalRecords,
        labOrders,
        radiologyOrders,
        prescriptions,
        invoices,
        antenatalRecords,
        admissions,
      },
    });
  } catch (error) {
    console.error('Get Patient Folder Error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching patient folder' });
  }
};

export const registerPatient = async (req, res) => {
  try {
    const seq = await getNextSequence(req.user.tenantId, 'PATIENT');
    const mrn = `MRN-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      phone,
      address,
      physicalCardNumber,
    } = req.body;
    const normalizedPhysicalCardNumber =
      typeof physicalCardNumber === 'string' && physicalCardNumber.trim()
        ? physicalCardNumber.trim().toUpperCase()
        : undefined;

    if (normalizedPhysicalCardNumber) {
      const existingCard = await Patient.exists({
        tenantId: req.tenantId,
        physicalCardNumber: normalizedPhysicalCardNumber,
      });
      if (existingCard) {
        return res.status(409).json({
          success: false,
          message: 'That physical card number is already linked to another patient in this clinic.',
        });
      }
    }

    const patient = await Patient.create({
      tenantId: req.user.tenantId,
      patientId: mrn,
      physicalCardNumber: normalizedPhysicalCardNumber,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      phone,
      address,
    });

    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.physicalCardNumber) {
      return res.status(409).json({
        success: false,
        message: 'That physical card number is already linked to another patient in this clinic.',
      });
    }
    res.status(500).json({ success: false, message: 'Error registering patient', error: error.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.id, tenantId: req.user.tenantId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching patient', error: error.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const updates = {};
    for (const field of ['firstName', 'lastName', 'gender', 'dateOfBirth', 'phone', 'address']) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating patient', error: error.message });
  }
};

export const updatePhysicalCardNumber = async (req, res) => {
  const rawCardNumber = req.body.physicalCardNumber;
  if (typeof rawCardNumber !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Physical card number must be text. Leave it empty to unlink the existing number.',
    });
  }

  const physicalCardNumber = rawCardNumber.trim().toUpperCase() || undefined;
  const patientIdQuery = [{ patientId: req.params.id }];
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    patientIdQuery.push({ _id: req.params.id });
  }

  try {
    const patient = await Patient.findOne({
      tenantId: req.tenantId,
      $or: patientIdQuery,
    });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (physicalCardNumber) {
      const alreadyLinked = await Patient.exists({
        tenantId: req.tenantId,
        physicalCardNumber,
        _id: { $ne: patient._id },
      });
      if (alreadyLinked) {
        return res.status(409).json({
          success: false,
          message: 'That physical card number is already linked to another patient in this clinic.',
        });
      }
      patient.physicalCardNumber = physicalCardNumber;
    } else {
      patient.physicalCardNumber = undefined;
    }

    await patient.save();
    await logAction({
      req,
      action: physicalCardNumber ? 'PHYSICAL_CARD_LINKED' : 'PHYSICAL_CARD_UNLINKED',
      module: 'PATIENT',
      description: `${physicalCardNumber ? 'Linked' : 'Unlinked'} a physical card number for ${patient.firstName} ${patient.lastName}.`,
      metadata: { patientId: patient._id, trackingNumber: patient.patientId },
    });

    return res.status(200).json({
      success: true,
      message: physicalCardNumber ? 'Physical card number linked.' : 'Physical card number unlinked.',
      data: { physicalCardNumber: patient.physicalCardNumber || null },
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.physicalCardNumber) {
      return res.status(409).json({
        success: false,
        message: 'That physical card number is already linked to another patient in this clinic.',
      });
    }
    console.error('Update Physical Card Number Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating physical card number' });
  }
};

export const updatePatientStatus = async (req, res) => {
  try {
    const { status } = req.body; // e.g., 'TRIAGE', 'DOCTOR_QUEUE', 'ADMITTED', 'DISCHARGED'
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { status },
      { new: true }
    );

    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating patient status', error: error.message });
  }
};