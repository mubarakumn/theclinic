import User from '../models/User.js';

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

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching staff members', error: error.message });
  }
};

// Create a new staff account (Admin/Super Admin only)
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, specialization, licenseNumber } = req.body;

    // Check if user email already exists within the tenant
    const userExists = await User.findOne({ tenantId: req.user.tenantId, email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists in your clinic' });
    }

    const user = await User.create({
      tenantId: req.user.tenantId,
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      specialization,
      licenseNumber,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating staff account', error: error.message });
  }
};

// Get single staff member by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).select('-password');

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
    const { firstName, lastName, role, phone, specialization, licenseNumber } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { firstName, lastName, role, phone, specialization, licenseNumber },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating staff account', error: error.message });
  }
};

// Toggle staff active/inactive status (Deactivate account)
export const toggleUserActiveStatus = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}`,
      data: { _id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user status', error: error.message });
  }
};