// routes/antenatalRoutes.js
import express from 'express';
import { enrollAntenatal, getAntenatalRecords, addAntenatalVisit } from '../controllers/antenatalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(enrollAntenatal)
  .get(getAntenatalRecords);

router.route('/:id/visits')
  .post(addAntenatalVisit);

export default router;