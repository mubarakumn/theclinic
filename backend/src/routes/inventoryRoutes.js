import express from 'express';
import {
  getInventoryItems,
  addInventoryItem,
  updateStock,
  getLowStockAlerts,
} from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInventoryItems)
  .post(authorize('PHARMACIST', 'ADMIN'), addInventoryItem);

router.route('/alerts/low-stock')
  .get(getLowStockAlerts);

router.route('/:id/stock')
  .patch(authorize('PHARMACIST', 'ADMIN'), updateStock);

export default router;