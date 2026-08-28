import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    patientId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String },
    address: { type: String }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of patientId PER tenant
patientSchema.index({ tenantId: 1, patientId: 1 }, { unique: true });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;