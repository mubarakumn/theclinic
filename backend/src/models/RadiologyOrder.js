// models/RadiologyOrder.js
import mongoose from 'mongoose';

const radiologyOrderSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scanType: { type: String, required: true }, // e.g. X-Ray, Ultrasound, CT Scan
    bodyPart: { type: String, required: true },
    price: { type: Number, required: true },
    clinicalNotes: { type: String },
    findings: { type: String },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
    isBilled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('RadiologyOrder', radiologyOrderSchema);