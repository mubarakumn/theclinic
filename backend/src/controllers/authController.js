import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import jwt from "jsonwebtoken";
import Role from "../models/Role.js";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";

// Helper to generate JWT tokens
const generateToken = (userId, tenantId) => {
  return jwt.sign({ id: userId, tenantId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1d",
  });
};

// Helper function to resolve permissions for a given role name
const getPermissionsForRole = async (roleName, tenantId) => {
  if (!roleName) return [];
  const tenant = await Tenant.findById(tenantId).select("rolePermissions").lean();
  const tenantRole = tenant?.rolePermissions?.find((role) => role.name === roleName);
  if (tenantRole) return tenantRole.permissions;
  const role = await Role.findOne({ name: roleName }).lean();
  return role ? role.permissions : [];
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

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already registered" });
    }

    // 1. Create Tenant
    const tenant = await Tenant.create({
      name: clinicName,
      code: clinicCode.toUpperCase(),
      email: normalizedEmail,
      phone,
    });

    // 2. Create Initial Admin User for Tenant
    const user = await User.create({
      tenantId: tenant._id,
      firstName,
      lastName,
      email: normalizedEmail,
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
    const { email, password, clinicCode } = req.body;

    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }
    if (clinicCode !== undefined && typeof clinicCode !== 'string') {
      return res.status(400).json({ success: false, message: "Clinic code must be a string" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let userQuery = { email: normalizedEmail };
    if (clinicCode) {
      const tenant = await Tenant.findOne({ code: clinicCode.trim().toUpperCase() }).select('_id');
      if (!tenant) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
      userQuery.tenantId = tenant._id;
    }

    const users = await User.find(userQuery).populate("tenantId");
    const matchingUsers = [];
    for (const candidate of users) {
      if (candidate.isActive && candidate.tenantId && await candidate.matchPassword(password)) {
        matchingUsers.push(candidate);
      }
    }

    if (matchingUsers.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (matchingUsers.length > 1) {
      return res.status(400).json({
        success: false,
        message: "This email is registered at multiple clinics. Enter your clinic code to continue.",
      });
    }

    const user = matchingUsers[0];

    const permissions = await getPermissionsForRole(user.role, user.tenantId._id);
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

export const acceptStaffInvitation = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== "string" || !token || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "A valid invitation and a password of at least 8 characters are required.",
      });
    }

    const invitationTokenHash = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      invitationTokenHash,
      invitationExpiresAt: { $gt: new Date() },
      invitationStatus: "PENDING",
      isActive: false,
    }).select("+invitationTokenHash +invitationExpiresAt").populate("tenantId");

    if (!user || !user.tenantId) {
      return res.status(400).json({
        success: false,
        message: "This invitation link is invalid or expired. Ask your clinic administrator to send a new one.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const consumed = await User.updateOne(
      {
        _id: user._id,
        invitationTokenHash,
        invitationExpiresAt: { $gt: new Date() },
        invitationStatus: "PENDING",
        isActive: false,
      },
      {
        $set: { password: passwordHash, isActive: true, invitationStatus: "ACCEPTED" },
        $unset: { invitationTokenHash: 1, invitationExpiresAt: 1 },
      },
    );
    if (consumed.modifiedCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "This invitation link is invalid or expired. Ask your clinic administrator to send a new one.",
      });
    }

    const permissions = await getPermissionsForRole(user.role, user.tenantId._id);
    const tokenForSession = generateToken(user._id, user.tenantId._id);
    return res.status(200).json({
      success: true,
      token: tokenForSession,
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
    console.error("Staff invitation acceptance failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to complete staff account setup." });
  }
};

// Get current logged-in user profile
export const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id, tenantId: req.tenantId }).populate("tenantId");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const permissions = await getPermissionsForRole(user.role, user.tenantId._id);

    res.status(200).json({
      success: true,
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

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, tenantId: req.tenantId },
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

    const user = await User.findOne({ _id: req.user._id, tenantId: req.tenantId }).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
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
