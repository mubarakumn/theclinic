import express from "express";
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  dispensePrescription,
  cancelPrescription,
} from "../controllers/prescriptionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

const viewRoles = ["DOCTOR", "PHARMACIST", "ADMIN", "SUPER_ADMIN"];

router.route("/")
  .get(authorize(...viewRoles), getPrescriptions)
  .post(authorize("DOCTOR"), createPrescription);

router.route("/:id")
  .get(authorize(...viewRoles), getPrescriptionById);

router.post("/:id/dispense", authorize("PHARMACIST"), dispensePrescription);

router.patch("/:id/status", authorize("DOCTOR", "ADMIN", "SUPER_ADMIN"), cancelPrescription);

export default router;