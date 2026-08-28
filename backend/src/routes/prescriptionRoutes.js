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

const viewRoles = ["doctor", "pharmacist", "admin", "super_admin"];

router.route("/")
  .get(authorize(...viewRoles), getPrescriptions)
  .post(authorize("doctor"), createPrescription);

router.route("/:id")
  .get(authorize(...viewRoles), getPrescriptionById);

router.post("/:id/dispense", authorize("pharmacist"), dispensePrescription);

router.patch("/:id/status", authorize("doctor", "admin", "super_admin"), cancelPrescription);

export default router;