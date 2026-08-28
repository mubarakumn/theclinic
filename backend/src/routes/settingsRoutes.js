import express from 'express';
import {
  getClinicSettings,
  updateClinicSettings,
  getServicePrices,
  createServicePrice,
  updateServicePrice,
  deleteServicePrice,
} from '../controllers/settingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Clinic Profile Routes
router.route('/clinic')
  .get(getClinicSettings)
  .put(authorize('ADMIN', 'SUPER_ADMIN'), updateClinicSettings);

// Service Price Tariff Routes
router.route('/tariffs')
  .get(getServicePrices)
  .post(authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), createServicePrice);

router.route('/tariffs/:id')
  .put(authorize('ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'), updateServicePrice)
  .delete(authorize('ADMIN', 'SUPER_ADMIN'), deleteServicePrice);

export default router;