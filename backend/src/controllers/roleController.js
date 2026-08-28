import Role from "../models/Role.js";
import { PERMISSIONS } from "../config/permissions.js";
import { logAction } from "../utils/auditLogger.js";
import mongoose from "mongoose";
/**
 * @desc    Get all roles and their permissions
 * @route   GET /api/roles
 * @access  Private (Admin)
 */
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      roles,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Get all valid system permissions
 * @route   GET /api/permissions
 * @access  Private (Admin)
 */
export const getPermissions = (req, res) => {
  res.status(200).json({
    success: true,
    permissions: PERMISSIONS,
  });
};

/**
 * @desc    Update permissions for a specific role
 * @route   PUT /api/roles/:name
 * @access  Private (Admin)
 */
export const updateRolePermissions = async (req, res) => {
  const { name } = req.params;
  const { permissions } = req.body;

  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: "Permissions must be an array." });
  }

  // Ensure no duplicate permissions are sent
  const uniquePermissions = [...new Set(permissions)];

  try {
    const role = await Role.findOne({ name });

    if (!role) {
      return res.status(404).json({ message: "Role not found." });
    }

    const originalPermissions = [...role.permissions];
    role.permissions = uniquePermissions;

    const updatedRole = await role.save(); // Mongoose 'enum' validation runs here

    // Create an audit log for the change
    logAction({
      actor: req.user._id,
      actorName: req.user.username,
      action: "ROLE_PERMISSIONS_UPDATED",
      description: `Updated permissions for role: '${role.name}'.`,
      // You can add more details like what was added/removed if needed
    });

    res.status(200).json({
      success: true,
      role: updatedRole,
    });
  } catch (error) {
    // Catches validation errors from the model
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid permission value provided.",
        details: error.message,
      });
    }
    console.error(`Error updating role ${name}:`, error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
