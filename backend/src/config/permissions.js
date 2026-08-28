/**
 * @file This file serves as the single source of truth for all valid permission identifiers in the system.
 * The format is "resource.action".
 * This list is used to validate permissions assigned to roles in the database.
 */
export const PERMISSIONS = [
  // User Management
  "users.create",
  "users.view",
  "users.update",
  "users.toggle_status",

  // Role & Permission Management
  "roles.view",
  "roles.manage",

  // System & Auditing
  "audit_logs.view",
  "dashboard.view",

  // Core HMS Features
  "patients.create",
  "patients.view",
  "patients.update",
  "medical_records.manage",
  "billing.manage",
  "inventory.manage",
  "prescriptions.manage",
];