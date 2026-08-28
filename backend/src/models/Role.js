import mongoose from "mongoose";
import { PERMISSIONS } from "../config/permissions.js";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, required: true },
    permissions: [
      {
        type: String,
        // Ensures that only valid permissions from our registry can be saved.
        enum: PERMISSIONS,
      },
    ],
  },
  { timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);
export default Role;