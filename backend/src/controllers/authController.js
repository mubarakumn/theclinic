import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import jwt from "jsonwebtoken";
import Role from "../models/Role.js";

// Helper to generate JWT tokens
const generateToken = (userId, tenantId) => {
  return jwt.sign({ id: userId, tenantId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1d",
  });
};

// Helper function to resolve permissions for a given role name
const getPermissionsForRole = async (roleName) => {
  if (!roleName) return [];
  try {
    const role = await Role.findOne({ name: roleName }).lean();
    return role ? role.permissions : [];
  } catch (error) {
    console.error(`Could not fetch permissions for role ${roleName}:`, error);
    return [];
  }
};

// Register a new Tenant Clinic + Super Admin account
export const registerTenant = async (req, res) => {
  try {
    const {
      clinicName,
      clinicCode,
      firstName,
      lastName,
      email,
      password,
      phone,
    } = req.body;

    // Check if tenant code or user email already exists
    const existingTenant = await Tenant.findOne({
      code: clinicCode.toUpperCase(),
    });
    if (existingTenant) {
      return res
        .status(400)
        .json({ success: false, message: "Clinic code is already registered" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already registered" });
    }

    // 1. Create Tenant
    const tenant = await Tenant.create({
      name: clinicName,
      code: clinicCode.toUpperCase(),
      email,
      phone,
    });

    // 2. Create Initial Admin User for Tenant
    const user = await User.create({
      tenantId: tenant._id,
      firstName,
      lastName,
      email,
      password,
      role: "SUPER_ADMIN",
      phone,
    });

    const token = generateToken(user._id, tenant._id);

    res.status(201).json({
      success: true,
      message: "registered Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering clinic",
      error: error.message,
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // Find user with password included
    const user = await User.findOne({ email }).populate("tenantId");
    console.log(user);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials1" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact admin.",
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const permissions = await getPermissionsForRole(user.role);
    const token = generateToken(user._id, user.tenantId._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        tenant: {
          _id: user.tenantId._id,
          name: user.tenantId.name,
          code: user.tenantId.code,
          plan: user.tenantId.subscriptionPlan,
          status: user.tenantId.subscriptionStatus,
        },
        permissions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error signing in",
      error: error.message,
    });
  }
};

// Get current logged-in user profile
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("tenantId");
    const permissions = await getPermissionsForRole(user.role);

    res.status(200).json({
      success: true,
      token,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        tenant: {
          _id: user.tenantId._id,
          name: user.tenantId.name,
          code: user.tenantId.code,
          plan: user.tenantId.subscriptionPlan,
          status: user.tenantId.subscriptionStatus,
        },
        permissions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving profile",
      error: error.message,
    });
  }
};

// Update personal user profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, specialization, licenseNumber } =
      req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone, specialization, licenseNumber },
      { new: true, runValidators: true },
    );

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// Change account password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect current password" });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id, user.tenantId);

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully", token });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};
