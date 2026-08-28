import AuditLog from '../models/AuditLog.js';

export const logAction = async ({
  req,
  action,
  module,
  description,
  metadata = {},
}) => {
  try {
    if (!req.user || !req.tenantId) return;

    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      userRole: req.user.role,
      action,
      module,
      description,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      metadata,
    });
  } catch (error) {
    // Prevent audit logger failure from blocking the primary business logic
    console.error('Failed to log audit event:', error.message);
  }
};