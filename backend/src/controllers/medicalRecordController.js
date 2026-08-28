import MedicalRecord from '../models/MedicalRecord.js';

export const getMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ tenantId: req.user.tenantId })
      .populate('patientId', 'firstName lastName mrn gender age')
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching medical records', error: error.message });
  }
};

export const getPatientHistory = async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      tenantId: req.user.tenantId,
      patientId: req.params.patientId,
    })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching patient history', error: error.message });
  }
};

export const createEncounter = async (req, res) => {
  try {
    const { patientId, chiefComplaint, vitals, consultationNotes } = req.body;

    const record = await MedicalRecord.create({
      tenantId: req.user.tenantId,
      patientId,
      doctorId: req.user._id,
      chiefComplaint,
      vitals,
      consultationNotes,
      status: 'IN_PROGRESS',
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating encounter', error: error.message });
  }
};

export const addDiagnosis = async (req, res) => {
  try {
    const { diagnosis, treatmentPlan } = req.body;
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { diagnosis, treatmentPlan, status: 'COMPLETED' },
      { new: true }
    );

    if (!record) return res.status(404).json({ success: false, message: 'Medical record not found' });
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating diagnosis', error: error.message });
  }
};