import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  // Mandatory: Tied directly to the hospital/tenant
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  // Mandatory: Tied directly to the patient registered
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  // Encounters / Vitals
  vitals: {
    temperature: Number,
    bloodPressure: String,
    pulseRate: Number,
    weight: Number
  },
  diagnosis: String,
  createdAt: { type: Date, default: Date.now }
});

// Enforce fast lookups for a patient's history within a specific hospital
medicalRecordSchema.index({ tenant: 1, patient: 1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;