import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    chiefComplaint: String,
    vitals: {
      temperature: Number,
      bloodPressure: String,
      pulseRate: Number,
      weight: Number,
    },
    consultationNotes: String,
    diagnosis: String,
    treatmentPlan: String,
    status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED'], default: 'IN_PROGRESS' },
  },
  { timestamps: true },
);

medicalRecordSchema.index({ tenantId: 1, patientId: 1 });

export default mongoose.model('MedicalRecord', medicalRecordSchema);
