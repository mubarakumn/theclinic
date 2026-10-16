import nodemailer from "nodemailer";
import config from "../config/config.js";

let transporter;

const getTransporter = () => {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS || !config.EMAIL_FROM) {
    throw new Error("SMTP email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM.");
  }
  if (!Number.isInteger(config.SMTP_PORT) || config.SMTP_PORT < 1 || config.SMTP_PORT > 65535) {
    throw new Error("SMTP_PORT must be an integer between 1 and 65535.");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    });
  }
  return transporter;
};

export const verifyEmailTransport = async () => {
  await getTransporter().verify();
};

export const sendStaffInvitation = async ({ email, firstName, clinicName, clinicCode, invitationUrl }) => {
  await getTransporter().sendMail({
    from: config.EMAIL_FROM,
    to: email,
    subject: `You're invited to join ${clinicName}`,
    text: [
      `Hello ${firstName},`,
      "",
      `You have been invited to join ${clinicName} (${clinicCode}) on Clinic HMS.`,
      "Set your password using the secure link below. This link expires in 48 hours.",
      "",
      invitationUrl,
      "",
      "If you were not expecting this invitation, you can ignore this email.",
    ].join("\n"),
  });
};
