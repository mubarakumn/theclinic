import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    enum: ['Consultation', 'Laboratory', 'Pharmacy', 'Admissions', 'Radiology', 'Registration', 'Surgery', 'Nursing care', 'Other'],
  },
  servicePriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePrice' },
  description: { type: String, required: true },
  quantity: { type: Number, min: 1, default: 1 },
  unitPrice: { type: Number, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  sourceId: { type: mongoose.Schema.Types.ObjectId }, // Reference to LabOrder, Prescription, Bed charge, etc.
});

const invoiceSchema = new mongoose.Schema(
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
    invoiceNo: { type: String, required: true, unique: true },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountReason: { type: String, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMode: {
      type: String,
      enum: ['POS', 'Bank Transfer', 'Cash', 'Card', 'Other', 'Pending'],
      default: 'Pending',
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'],
      default: 'UNPAID',
    },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transactionRef: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;