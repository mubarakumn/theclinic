import express from "express";
import {
  createBed,
  getBeds,
  getBedById,
  updateBed,
  assignPatientToBed,
  releaseBed,
} from "../controllers/bedController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// --- Bed Management Routes ---
router
  .route("/")
  .post(authorize("ADMIN", "SUPER_ADMIN"), createBed)
  .get(getBeds); // All staff can view beds

router
  .route("/:id")
  .get(getBedById) // All staff can view a single bed
  .patch(authorize("ADMIN", "SUPER_ADMIN"), updateBed);

// --- Bed Occupancy Routes ---
const occupancyRoles = ["DOCTOR", "NURSE", "RECEPTIONIST", "ADMIN", "SUPER_ADMIN"];

router.post("/:id/assign", authorize(...occupancyRoles), assignPatientToBed);
router.post("/:id/release", authorize(...occupancyRoles), releaseBed);

export default router;
