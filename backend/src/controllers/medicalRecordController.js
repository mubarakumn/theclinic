import MedicalRecord from '../models/MedicalRecord.js';
import Patient from '../models/Patient.js';

export const getMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ tenantId: req.user.tenantId })
      .populate({ path: 'patientId', match: { tenantId: req.tenantId }, select: 'firstName lastName patientId gender dateOfBirth' })
      .populate({ path: 'doctorId', match: { tenantId: req.tenantId }, select: 'firstName lastName' })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching medical records', error: error.message });
  }
};

export const getPatientHistory = async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      tenantId: req.tenantId,
      patientId: req.params.patientId,
    })
      .populate({ path: 'doctorId', match: { tenantId: req.tenantId }, select: 'firstName lastName specialization' })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching patient history', error: error.message });
  }
};

export const createEncounter = async (req, res) => {
  try {
    const { patientId, chiefComplaint, vitals, consultationNotes } = req.body;
    const patient = await Patient.findOne({ _id: patientId, tenantId: req.tenantId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const record = await MedicalRecord.create({
      tenantId: req.tenantId,
      patientId,
      doctorId: req.user._id,
      chiefComplaint,
      vitals,
      consultationNotes,
      diagnosis: req.body.diagnosis,
      treatmentPlan: req.body.treatmentPlan,
      status: req.body.diagnosis ? 'COMPLETED' : 'IN_PROGRESS',
    });

    res.status(201).json({
      success: true,
      data: await record.populate([
        { path: 'patientId', match: { tenantId: req.tenantId }, select: 'firstName lastName patientId gender dateOfBirth' },
        { path: 'doctorId', match: { tenantId: req.tenantId }, select: 'firstName lastName' },
      ]),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating encounter', error: error.message });
  }
};

export const addDiagnosis = async (req, res) => {
  try {
    const { diagnosis, treatmentPlan } = req.body;
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { diagnosis, treatmentPlan, status: 'COMPLETED' },
      { new: true }
    );

    if (!record) return res.status(404).json({ success: false, message: 'Medical record not found' });
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating diagnosis', error: error.message });
  }
};