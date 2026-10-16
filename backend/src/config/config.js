import dotenv from "dotenv";

dotenv.config();

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const PORT = Number(required("PORT"));
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const MONGODBURL = required("MONGODB_URI");
const CLIENT_URL = required("CLIENT_URL");
try {
  new URL(CLIENT_URL);
} catch {
  throw new Error("CLIENT_URL must be a valid absolute URL.");
}

const JWT_SECRET = required("JWT_SECRET");
const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN?.trim() ||
  (process.env.JWT_COOKIE_EXPIRES_IN
    ? `${process.env.JWT_COOKIE_EXPIRES_IN.trim()}d`
    : "1d");
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;

const config = {
  PORT,
  MONGODBURL,
  CLIENT_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
};

export default config;
