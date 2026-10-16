import express from 'express';
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  toggleUserActiveStatus,
  resendStaffInvitation,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce auth token verification
router.use(protect);

// Staff management endpoints (restricted to ADMIN and SUPER_ADMIN)
router.route('/')
  .get(authorize('ADMIN', 'SUPER_ADMIN'), getUsers)
  .post(authorize('ADMIN', 'SUPER_ADMIN'), createUser);

router.route('/:id')
  .get(authorize('ADMIN', 'SUPER_ADMIN'), getUserById)
  .put(authorize('ADMIN', 'SUPER_ADMIN'), updateUser);

router.post('/:id/resend-invitation', authorize('ADMIN', 'SUPER_ADMIN'), resendStaffInvitation);

router.route('/:id/toggle-active')
  .patch(authorize('ADMIN', 'SUPER_ADMIN'), toggleUserActiveStatus);

export default router;