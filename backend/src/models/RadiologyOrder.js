// models/RadiologyOrder.js
import mongoose from 'mongoose';

const radiologyOrderSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    servicePriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePrice' },
    scanType: { type: String, required: true, trim: true },
    bodyPart: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    clinicalNotes: { type: String, trim: true },
    findings: { type: String, trim: true },
    reportedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportCompletedAt: { type: Date },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
    isBilled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('RadiologyOrder', radiologyOrderSchema);