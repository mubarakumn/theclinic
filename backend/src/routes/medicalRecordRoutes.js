import express from 'express';
import {
  getMedicalRecords,
  getPatientHistory,
  createEncounter,
  addDiagnosis,
} from '../controllers/medicalRecordController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMedicalRecords);

router.route('/patient/:patientId')
  .get(getPatientHistory);

router.route('/encounter')
  .post(authorize('DOCTOR', 'NURSE', 'ADMIN'), createEncounter);

router.route('/:id/diagnosis')
  .patch(authorize('DOCTOR'), addDiagnosis);

export default router;