import mongoose from 'mongoose';

const labOrderSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    servicePriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePrice' },
    testName: { type: String, required: true },
    category: { type: String },
    cost: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
    isBilled: { type: Boolean, default: false },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    results: { type: String },
  },
  { timestamps: true }
);

const LabOrder = mongoose.model('LabOrder', labOrderSchema);

export default LabOrder;