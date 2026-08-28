import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();


router.use(protect);

const dashboardRoles = ["SUPER_ADMIN", "admin", "doctor", "receptionist"];

router.get("/summary", authorize(...dashboardRoles), getDashboardSummary);

export default router;