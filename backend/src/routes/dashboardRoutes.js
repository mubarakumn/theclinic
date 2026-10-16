import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();


router.use(protect);

const dashboardRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "DOCTOR",
  "NURSE",
  "PHARMACIST",
  "LAB_TECH",
  "RADIOLOGIST",
  "ACCOUNTANT",
  "RECEPTIONIST",
];

router.get("/summary", authorize(...dashboardRoles), getDashboardSummary);

export default router;