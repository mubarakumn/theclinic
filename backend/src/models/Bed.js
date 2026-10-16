import mongoose from "mongoose";

const bedSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    wardName: {
      type: String,
      required: true,
      trim: true,
    },
    bedNumber: {
      type: String,
      required: true,
      trim: true,
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    currentPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },
  },
  { timestamps: true },
);

bedSchema.index({ tenantId: 1, wardName: 1, bedNumber: 1 }, { unique: true });

export default mongoose.model("Bed", bedSchema);
