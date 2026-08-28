import mongoose from 'mongoose';

const servicePriceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['CONSULTATION', 'LABORATORY', 'RADIOLOGY', 'BED_NIGHT', 'SURGERY', 'NURSING_CARE', 'OTHER'],
      default: 'CONSULTATION',
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    serviceCode: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure service names or codes are unique within the same clinic
servicePriceSchema.index({ tenantId: 1, serviceName: 1 }, { unique: true });

export default mongoose.model('ServicePrice', servicePriceSchema);