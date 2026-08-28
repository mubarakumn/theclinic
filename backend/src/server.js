import express from "express";
import config from "./config/config.js";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import antenatalRoutes from './routes/antenatalRoutes.js';
import labRoutes from './routes/labRoutes.js';
import radiologyRoutes from './routes/radiologyRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import bedRoutes from './routes/bedRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import rolesRoutes from './routes/roleRoutes.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());


// API Endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/medical-records', medicalRecordRoutes);
app.use('/api/v1/antenatal', antenatalRoutes);
app.use('/api/v1/lab', labRoutes);
app.use('/api/v1/radiology', radiologyRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/beds', bedRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/roles', rolesRoutes)


app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

mongoose.connect(config.MONGODBURL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

