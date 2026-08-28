import express from "express";
import {
  getRoles,
  getPermissions,
  updateRolePermissions,
} from "../controllers/roleController.js";
import { protect, requirePermission } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// Secure routes with permission checks
router.get("/", requirePermission("roles.view"), getRoles);
router.get("/permissions", requirePermission("roles.view"), getPermissions);
router.put("/:name", requirePermission("roles.manage"), updateRolePermissions);

export default router;
