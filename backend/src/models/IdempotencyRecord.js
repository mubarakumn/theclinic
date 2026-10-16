import mongoose from "mongoose";

const idempotencyRecordSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    key: { type: String, required: true },
    fingerprint: { type: String, required: true },
    state: {
      type: String,
      enum: ["PROCESSING", "COMPLETED"],
      required: true,
    },
    responseStatus: Number,
    responseBody: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

idempotencyRecordSchema.index(
  { tenantId: 1, userId: 1, key: 1 },
  { unique: true },
);

export default mongoose.model("IdempotencyRecord", idempotencyRecordSchema);
