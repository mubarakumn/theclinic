import express from 'express';
import {
  registerTenant,
  login,
  acceptStaffInvitation,
  getMe,
  updateProfile,
  updatePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', registerTenant);
router.post('/login', login);
router.post('/accept-invitation', acceptStaffInvitation);

// Protected Self-Management Routes
router.use(protect);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/update-password', updatePassword);

export default router;