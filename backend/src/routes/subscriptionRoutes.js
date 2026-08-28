import express from 'express';
import {
  getSubscriptionStatus,
  updateSubscriptionPlan,
  cancelSubscription,
} from '../controllers/subscriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// View current plan and usage stats
router.route('/')
  .get(getSubscriptionStatus);

// Management endpoints restricted to Clinic Admins
router.route('/upgrade')
  .post(authorize('ADMIN', 'SUPER_ADMIN'), updateSubscriptionPlan);

router.route('/cancel')
  .post(authorize('ADMIN', 'SUPER_ADMIN'), cancelSubscription);

export default router;