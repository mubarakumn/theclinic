import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      // e.g., 'box', 'bottle', 'piece'
      type: String,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    reorderLevel: { type: Number, default: 0 },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

inventoryItemSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.model("InventoryItem", inventoryItemSchema);
