// routes/radiologyRoutes.js
import express from 'express';
import { getRadiologyOrders, createRadiologyOrder, updateRadiologyReport } from '../controllers/radiologyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRadiologyOrders)
  .post(createRadiologyOrder);

router.route('/:id/report')
  .patch(updateRadiologyReport);

export default router;