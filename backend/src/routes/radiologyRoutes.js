// routes/radiologyRoutes.js
import express from 'express';
import { getRadiologyOrders, createRadiologyOrder, updateRadiologyReport } from '../controllers/radiologyController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RADIOLOGIST'), getRadiologyOrders)
  .post(authorize('SUPER_ADMIN', 'ADMIN', 'DOCTOR'), createRadiologyOrder);

router.route('/:id/report')
  .patch(authorize('SUPER_ADMIN', 'ADMIN', 'RADIOLOGIST'), updateRadiologyReport);

export default router;