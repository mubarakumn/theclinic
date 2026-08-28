// routes/labRoutes.js
import express from 'express';
import { getLabOrders, createLabOrder, updateLabResult } from '../controllers/labController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getLabOrders)
  .post(createLabOrder);

router.route('/:id/results')
  .patch(updateLabResult);

export default router;