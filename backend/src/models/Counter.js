import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  model: { type: String, required: true }, // e.g., 'patient', 'invoice'
  seq: { type: Number, default: 0 }
});

counterSchema.index({ tenantId: 1, model: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;