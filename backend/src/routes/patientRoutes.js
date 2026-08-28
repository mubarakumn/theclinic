import express from 'express';
import {
  getPatients,
  registerPatient,
  getPatientById,
  updatePatient,
  updatePatientStatus,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPatients)
  .post(registerPatient);

router.route('/:id')
  .get(getPatientById)
  .put(updatePatient);

router.route('/:id/status')
  .patch(authorize('RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN'), updatePatientStatus);

export default router;