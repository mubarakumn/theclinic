// models/AntenatalRecord.js
import mongoose from 'mongoose';

const antenatalRecordSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    ancNumber: { type: String, required: true },
    lmp: { type: Date, required: true },
    edd: { type: Date, required: true },
    gestationalAgeWeeks: { type: Number },
    gravida: { type: Number, default: 1 },
    para: { type: Number, default: 0 },
    bloodGroup: { type: String },
    genotype: { type: String },
    riskFactors: [{ type: String }],
    visits: [
      {
        date: { type: Date, default: Date.now },
        fundalHeightCm: Number,
        fetalHeartRate: Number,
        bloodPressure: String,
        weightKg: Number,
        notes: String,
        attendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    status: { type: String, enum: ['ACTIVE', 'DELIVERED', 'CLOSED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export default mongoose.model('AntenatalRecord', antenatalRecordSchema);