import { Routes, Route } from "react-router-dom";

// Public Marketing & Onboarding Pages
import LandingPage from "../pages/Public/LandingPage.jsx";
import Features from "../pages/Public/Features.jsx";
import Pricing from "../pages/Public/Pricing.jsx";
import RegisterClinic from "../pages/Public/RegisterClinic.jsx";
import AcceptInvitation from "../pages/Public/AcceptInvitation.jsx";
import Login from "../auth/login.jsx";
import SubscriptionExpired from "../pages/Subscription/SubscriptionExpired.jsx";
import Unauthorized from "../pages/Unauthorized/Unauthorized.jsx";
import NotFound from "../pages/NotFound/NotFound.jsx";

// Protected Layout & Guard
import ProtectedRoute from "../layouts/ProtectedRoute.jsx";
import AppLayout from "../layouts/AppLayout.jsx";

// App Dashboard & Administration
import Dashboard from "../pages/Dashboard/Dashboard.jsx";
import Users from "../pages/Users/Users.jsx";
import RolesPermissions from "../pages/RolesPermissions/RolesPermissions.jsx";
import SubscriptionSettings from "../pages/Subscription/SubscriptionSettings.jsx";
import AuditLogs from "../pages/AuditLogs/AuditLogs.jsx";
import ServicesPriceList from "../pages/Settings/ServicesPriceList.jsx";

// Core Clinical & Operational Modules
import Patients from "../pages/Patients/Patients.jsx";
import PatientDetail from "../pages/Patients/PatientDetail.jsx";
import PatientForm from "../pages/Patients/PatientForm.jsx";
import MedicalRecords from "../pages/MedicalRecords/MedicalRecords.jsx";
import Antenatal from "../pages/Antenatal/Antenatal.jsx";
import Laboratory from "../pages/Laboratory/Laboratory.jsx";
import Radiology from "../pages/Radiology/Radiology.jsx";
import Pharmacy from "../pages/Pharmacy/Pharmacy.jsx";
import Billing from "../pages/Billing/Billing.jsx";
import Admissions from "../pages/Admissions/Admissions.jsx";
import Inventory from "../pages/Inventory.jsx";

import { ROLES, ALL_ROLES } from "./roles.js";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterClinic />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/subscription-expired" element={<SubscriptionExpired />} />

      {/* Protected Clinical App Shell */}
      <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Patient directory and patient record are visible to all clinic staff;
            write-capable registration routes keep their existing role boundary. */}
          <Route
            element={
            <ProtectedRoute allowedRoles={ALL_ROLES} />
            }
          >
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
          </Route>

          {/* Patient management */}
          <Route
            element={
            <ProtectedRoute
                allowedRoles={[
                  ROLES.SUPER_ADMIN,
                  ROLES.ADMIN,
                  ROLES.RECEPTIONIST,
                  ROLES.DOCTOR,
                  ROLES.NURSE,
                  ROLES.LAB_TECH,
                  ROLES.PHARMACIST,
                  ROLES.ACCOUNTANT,
                ]}
            />
            }
          >
            <Route path="/patients/new" element={<PatientForm />} />
            <Route path="/patients/:id/edit" element={<PatientForm />} />
          </Route>

          {/* Clinical Records & Antenatal */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE]}
              />
            }
          >
            <Route path="/medical-records" element={<MedicalRecords />} />
            <Route path="/antenatal" element={<Antenatal />} />
          </Route>

          {/* Ancillary Services */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB_TECH]}
              />
            }
          >
            <Route path="/laboratory" element={<Laboratory />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGIST]}
              />
            }
          >
            <Route path="/radiology" element={<Radiology />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PHARMACIST]}
              />
            }
          >
            <Route path="/pharmacy" element={<Pharmacy />} />
          </Route>

          {/* Billing & Financial Operations */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT]}
              />
            }
          >
            <Route path="/billing" element={<Billing />} />
          </Route>

          {/* Admissions & Bed Management */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.NURSE]}
              />
            }
          >
            <Route path="/admissions" element={<Admissions />} />
          </Route>

          {/* Inventory Management */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PHARMACIST]}
              />
            }
          >
            <Route path="/inventory" element={<Inventory />} />
          </Route>

          {/* Clinic Administration & Settings */}
          <Route
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]} />
            }
          >
            <Route path="/users" element={<Users />} />
            <Route path="/roles-permissions" element={<RolesPermissions />} />
            <Route path="/services-price-list" element={<ServicesPriceList />} />
            <Route path="/subscription-settings" element={<SubscriptionSettings />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>

        </Route>
      </Route>

      {/* Keep unknown URLs out of the protected app shell. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};