import AuditLog from '../models/AuditLog.js';

// Get audit logs with filtering and pagination
export const getAuditLogs = async (req, res) => {
  try {
    const { module, action, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { tenantId: req.tenantId };

    if (module) query.module = module;
    if (action) query.action = action;
    if (userId) query.userId = userId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
      error: error.message,
    });
  }
};

// Clear / Archive old audit logs (Admin only)
export const clearOldAuditLogs = async (req, res) => {
  try {
    const { days = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const result = await AuditLog.deleteMany({
      tenantId: req.tenantId,
      createdAt: { $lt: cutoffDate },
    });

    res.status(200).json({
      success: true,
      message: `Successfully purged ${result.deletedCount} audit logs older than ${days} days.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error purging audit logs',
      error: error.message,
    });
  }
};