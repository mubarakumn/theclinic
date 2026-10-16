import express from 'express';
import {
  getPatients,
  getPatientFolder,
  registerPatient,
  getPatientById,
  updatePatient,
  updatePhysicalCardNumber,
  updatePatientStatus,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPatients)
  .post(registerPatient);

router.get('/:id/folder', getPatientFolder);

router.patch(
  '/:id/physical-card',
  authorize('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'),
  updatePhysicalCardNumber,
);

router.route('/:id')
  .get(getPatientById)
  .put(updatePatient);

router.route('/:id/status')
  .patch(authorize('RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN'), updatePatientStatus);

export default router;