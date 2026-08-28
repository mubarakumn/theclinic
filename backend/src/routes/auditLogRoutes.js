import express from 'express';
import { getAuditLogs, clearOldAuditLogs } from '../controllers/auditLogController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Audit logs are read-only for system activity review (ADMIN & SUPER_ADMIN)
router.route('/')
  .get(authorize('ADMIN', 'SUPER_ADMIN'), getAuditLogs);

router.route('/purge')
  .post(authorize('SUPER_ADMIN', 'ADMIN'), clearOldAuditLogs);

export default router;