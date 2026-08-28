import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODBURL = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hospital_management1";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "Clinic-hospital-secret";
const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN || 30; // in days

const config = {
  PORT,
  MONGODBURL,
  CLIENT_URL,
  JWT_SECRET,
  JWT_COOKIE_EXPIRES_IN,
};

export default config;
