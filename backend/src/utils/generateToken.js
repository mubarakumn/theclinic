import jwt from "jsonwebtoken";
import config from "../config/config.js";

const generateToken = (userId, tenantId) => {
  return jwt.sign(
    { id: userId, tenantId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN },
  );
};

export default generateToken;