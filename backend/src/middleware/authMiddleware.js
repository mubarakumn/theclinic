import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";
import config from "../config/config.js";

/**
 * @desc    Protect routes - verifies JWT from cookies or Authorization header
 */
export const protect = async (req, res, next) => {
  let token;
  // 1. Check HttpOnly Cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check Authorization Bearer header fallback
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Fetch user and exclude password field
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "User belonging to this token no longer exists" });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: "User account is inactive" });
    }
    
    req.user = user;

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed or expired" });
  }
};

/**
 * @desc    Granular permission-based access control
 * @param   {string} requiredPermission - Permission identifier (e.g., 'patients.view', 'users.create')
 */
export const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({ message: "Forbidden: No assigned user role found" });
    }

    // Bypass check for super_admin
    if (req.user.role === "super_admin") {
      return next();
    }

    try {
      // Lookup permissions from the Role collection in database
      const role = await Role.findOne({ name: req.user.role });

      if (!role || !Array.isArray(role.permissions) || !role.permissions.includes(requiredPermission)) {
        return res.status(403).json({
          message: `Forbidden: You do not have the required permission (${requiredPermission})`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission Check Error:", error);
      return res
        .status(500)
        .json({ message: "Server error during permission check" });
    }
  };
};

/**
 * @desc    Legacy Role-based authorization fallback
 * @deprecated Use requirePermission() for database-driven role control.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }
    next();
  };
};