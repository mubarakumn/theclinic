import Patient from '../models/Patient.js';
import getNextSequence from '../utils/getNextSequence.js';

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
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching patients', error: error.message });
  }
};

export const registerPatient = async (req, res) => {
  try {
    const seq = await getNextSequence(req.user.tenantId, 'PATIENT');
    const mrn = `MRN-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    const { firstName, lastName, gender, dateOfBirth, phone, address } = req.body;
    const patient = await Patient.create({
      tenantId: req.user.tenantId,
      patientId: mrn,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      phone,
      address,
    });

    res.status(201).json({ success: true, data: patient });
  } catch (error) {
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