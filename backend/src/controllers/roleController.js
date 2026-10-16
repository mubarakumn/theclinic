import Role from '../models/Role.js';
import Tenant from '../models/Tenant.js';
import { PERMISSIONS } from '../config/permissions.js';
import { logAction } from '../utils/auditLogger.js';

export const getRoles = async (req, res) => {
  try {
    const [roles, tenant] = await Promise.all([
      Role.find({}).sort({ name: 1 }).lean(),
      Tenant.findById(req.tenantId).select('rolePermissions').lean(),
    ]);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const roleOverrides = new Map(
      (tenant.rolePermissions || []).map((role) => [role.name, role.permissions])
    );
    const tenantRoles = roles.map((role) => ({
      ...role,
      permissions: roleOverrides.get(role.name) || role.permissions,
    }));

    res.status(200).json({ success: true, roles: tenantRoles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getPermissions = (req, res) => {
  res.status(200).json({ success: true, permissions: PERMISSIONS });
};

export const updateRolePermissions = async (req, res) => {
  const name = req.params.name.toUpperCase();
  const { permissions } = req.body;

  if (!Array.isArray(permissions) || permissions.some((permission) => !PERMISSIONS.includes(permission))) {
    return res.status(400).json({ success: false, message: 'One or more permission values are invalid.' });
  }

  try {
    const role = await Role.findOne({ name }).lean();
    if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });

    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found.' });

    const uniquePermissions = [...new Set(permissions)];
    const tenantRole = tenant.rolePermissions.find((item) => item.name === name);
    if (tenantRole) {
      tenantRole.permissions = uniquePermissions;
    } else {
      tenant.rolePermissions.push({ name, permissions: uniquePermissions });
    }
    await tenant.save();

    const updatedRole = {
      ...role,
      permissions: uniquePermissions,
    };
    await logAction({
      req,
      action: 'ROLE_PERMISSIONS_UPDATED',
      module: 'ROLE',
      description: `Updated permissions for role: '${name}'.`,
      metadata: { roleName: name },
    });

    res.status(200).json({ success: true, role: updatedRole });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid permission value provided.',
        details: error.message,
      });
    }
    console.error(`Error updating role ${name}:`, error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
