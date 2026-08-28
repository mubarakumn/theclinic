import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "../models/Role.js";
import config from "./config.js";

dotenv.config();

const roles = [
  {
    name: "SUPER_ADMIN",
    description: "Has all permissions and can manage the entire system.",
    permissions: [
      "users.create",
      "users.view",
      "users.update",
      "users.toggle_status",
      "roles.view",
      "roles.manage",
      "audit_logs.view",
      "dashboard.view",
      "patients.create",
      "patients.view",
      "patients.update",
      "medical_records.manage",
      "billing.manage",
      "inventory.manage",
      "prescriptions.manage",
    ],
  },
  {
    name: "ADMIN",
    description: "Can manage users and other administrative tasks.",
    permissions: [
      "users.create",
      "users.view",
      "users.update",
      "users.toggle_status",
      "roles.view",
      "roles.manage",
      "audit_logs.view",
      "dashboard.view",
      "billing.manage",
      "inventory.manage",
    ],
  },
  {
    name: "DOCTOR",
    description: "Can manage patient records.",
    permissions: [
      "patients.view",
      "patients.update",
      "medical_records.manage",
      "prescriptions.manage",
    ],
  },
  {
    name: "RECEPTIONIST",
    description: "Manages patient registration.",
    permissions: [
      "patients.create",
      "patients.view",
      "dashboard.view",
    ],
  },
  {
    name: "PHARMACIST",
    description: "Manages pharmacy inventory and dispenses medication.",
    permissions: ["inventory.manage", "prescriptions.manage"],
  },
  {
    name: "LABORATORY",
    description: "Manages lab tests and results.",
    permissions: [], // Add specific lab permissions to config/permissions.js first
  },
  {
    name: "CASHIER",
    description: "Handles billing and payments.",
    permissions: ["billing.manage"],
  },
  {
    name: "NURSE",
    description: "Patient care and vital recording.",
    permissions: ["patients.view"], // Add vitals.record permission if needed
  },
];

mongoose
  .connect(config.MONGODBURL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

const seedRoles = async () => {
  try {
    await Role.deleteMany();
    console.log("Roles cleared from database.");

    // Using a loop to ensure unique roles are inserted one by one
    for (const roleData of roles) {
      const roleName = roleData.name.toUpperCase();
      const existingRole = await Role.findOne({ name: roleName });
      if (!existingRole) {
        await Role.create(roleData);
        console.log(`Role '${roleData.name}' added.`);
      } else {
        console.log(`Role '${roleData.name}' already exists. Skipped.`);
      }
    }

    console.log("Database has been seeded with roles!");
    process.exit();
  } catch (error) {
    console.error(`Seeder error: ${error.message}`);
    process.exit(1);
  }
};

seedRoles();
