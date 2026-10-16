import { createHash, randomBytes } from "node:crypto";
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import config from '../config/config.js';
import { sendStaffInvitation } from '../utils/email.js';
import { logAction } from '../utils/auditLogger.js';

const invitationExpiry = () => new Date(Date.now() + 48 * 60 * 60 * 1000);
const staffRoles = [
  'ADMIN',
  'DOCTOR',
  'NURSE',
  'PHARMACIST',
  'LAB_TECH',
  'RADIOLOGIST',
  'ACCOUNTANT',
  'RECEPTIONIST',
];

const createInvitation = async (user, tenant) => {
  const token = randomBytes(32).toString('hex');
  user.invitationTokenHash = createHash('sha256').update(token).digest('hex');
  user.invitationExpiresAt = invitationExpiry();
  await user.save();
  if (!config.CLIENT_URL) {
    throw new Error("CLIENT_URL must be configured to create staff invitation links.");
  }
  const invitationUrl = `${config.CLIENT_URL.replace(/\/+$/, '')}/accept-invitation#token=${token}`;
  await sendStaffInvitation({
    email: user.email,
    firstName: user.firstName,
    clinicName: tenant.name,
    clinicCode: tenant.code,
    invitationUrl,
  });
  return user.invitationExpiresAt;
};

// Get all staff members for the tenant
export const getUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    const query = { tenantId: req.user.tenantId };

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password +invitationTokenHash +invitationExpiresAt').sort({ createdAt: -1 });
    const now = new Date();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map((user) => {
        const { invitationTokenHash, invitationExpiresAt, ...safeUser } = user.toObject();
        const invitationPending = user.invitationStatus === "PENDING";
        return {
          ...safeUser,
          invitationPending,
          invitationExpired: invitationPending && (!invitationExpiresAt || invitationExpiresAt <= now),
        };
      }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching staff members', error: error.message });
  }
};

// Create a new staff account (Admin/Super Admin only)
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, role, phone, specialization, licenseNumber } = req.body;
    const emailAddress = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!firstName?.trim() || !lastName?.trim() || !emailAddress || !staffRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'First name, last name, a valid email address, and a staff role are required' });
    }

    // Check if user email already exists within the tenant
    const userExists = await User.findOne({ tenantId: req.tenantId, email: emailAddress });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists in your clinic' });
    }

    const tenant = await Tenant.findById(req.tenantId).select('name code');
    if (!tenant) return res.status(404).json({ success: false, message: 'Clinic not found' });

    const user = await User.create({
      tenantId: req.tenantId,
      firstName,
      lastName,
      email: emailAddress,
      password: randomBytes(48).toString('hex'),
      role,
      phone,
      specialization,
      licenseNumber,
      isActive: false,
      invitationStatus: "PENDING",
    });

    try {
      await createInvitation(user, tenant);
    } catch (error) {
      await User.deleteOne({ _id: user._id, tenantId: req.tenantId });
      console.error('Failed to send staff invitation:', error.message);
      return res.status(502).json({
        success: false,
        message: 'Staff account was not created because the invitation email could not be sent. Check SMTP settings and try again.',
      });
    }

    await logAction({
      req,
      action: 'STAFF_INVITED',
      module: 'USER',
      description: `Invited ${firstName} ${lastName} as ${role}.`,
      metadata: { staffUserId: user._id, email: emailAddress, role },
    });

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${emailAddress}.`,
      data: { _id: user._id, firstName, lastName, email: emailAddress, role, isActive: false },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating staff account', error: error.message });
  }
};

// Get single staff member by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).select('-password -invitationTokenHash -invitationExpiresAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching staff member', error: error.message });
  }
};

// Update staff account details
export const updateUser = async (req, res) => {
  try {
    const updates = {};
    for (const field of ['firstName', 'lastName', 'role', 'phone', 'specialization', 'licenseNumber']) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (updates.role !== undefined && !staffRoles.includes(updates.role)) {
      return res.status(400).json({ success: false, message: 'A valid staff role is required' });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -invitationTokenHash -invitationExpiresAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating staff account', error: error.message });
  }
};

// Toggle staff active/inactive status (Deactivate account)
export const resendStaffInvitation = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      isActive: false,
      invitationStatus: "PENDING",
    }).select('+invitationTokenHash +invitationExpiresAt');
    if (!user) return res.status(404).json({ success: false, message: 'Pending staff invitation not found' });

    const tenant = await Tenant.findById(req.tenantId).select('name code');
    if (!tenant) return res.status(404).json({ success: false, message: 'Clinic not found' });

    await createInvitation(user, tenant);
    await logAction({
      req,
      action: 'STAFF_INVITATION_RESENT',
      module: 'USER',
      description: `Resent the staff invitation to ${user.email}.`,
      metadata: { staffUserId: user._id, email: user.email },
    });
    res.status(200).json({ success: true, message: `Invitation resent to ${user.email}.` });
  } catch (error) {
    console.error('Failed to resend staff invitation:', error.message);
    res.status(502).json({
      success: false,
      message: 'Could not send the invitation email. Check SMTP settings and try again.',
    });
  }
};

export const toggleUserActiveStatus = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    if (!user.isActive && user.invitationStatus === "PENDING") {
      return res.status(409).json({ success: false, message: 'This staff member must set their password using the invitation link first' });
    }

    user.isActive = !user.isActive;
    await user.save();
    await logAction({
      req,
      action: user.isActive ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED',
      module: 'USER',
      description: `${user.isActive ? 'Activated' : 'Deactivated'} staff account ${user.email}.`,
      metadata: { staffUserId: user._id, email: user.email },
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}`,
      data: { _id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user status', error: error.message });
  }
};