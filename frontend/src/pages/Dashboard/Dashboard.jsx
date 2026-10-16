import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bed,
  ChevronRight,
  Clock,
  FileText,
  History,
  Package,
  Pill,
  Receipt,
  ShieldAlert,
  TestTube,
  UserCheck,
  Users,
  UserPlus,
} from "lucide-react";
import API from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../routes/roles";

const navigationCards = [
  {
    id: "patients",
    title: "Patients",
    subtitle: "Find patients and open patient records",
    icon: Users,
    route: "/patients",
    color: "bg-blue-600",
    allowedRoles: Object.values(ROLES),
  },
  {
    id: "records",
    title: "Medical Records",
    subtitle: "Record consultations and patient vitals",
    icon: FileText,
    route: "/medical-records",
    color: "bg-emerald-600",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE],
  },
  {
    id: "laboratory",
    title: "Laboratory",
    subtitle: "Review lab orders and diagnostics",
    icon: TestTube,
    route: "/laboratory",
    color: "bg-sky-600",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB_TECH],
  },
  {
    id: "radiology",
    title: "Radiology",
    subtitle: "Review imaging requests and reports",
    icon: TestTube,
    route: "/radiology",
    color: "bg-cyan-700",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGIST],
  },
  {
    id: "pharmacy",
    title: "Pharmacy",
    subtitle: "Review prescriptions and dispensing",
    icon: Pill,
    route: "/pharmacy",
    color: "bg-amber-600",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PHARMACIST],
  },
  {
    id: "billing",
    title: "Billing",
    subtitle: "Review invoices and payments",
    icon: Receipt,
    route: "/billing",
    color: "bg-purple-600",
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.RECEPTIONIST,
      ROLES.ACCOUNTANT,
    ],
  },
  {
    id: "admissions",
    title: "Admissions",
    subtitle: "Manage admissions and ward beds",
    icon: Bed,
    route: "/admissions",
    color: "bg-rose-600",
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.RECEPTIONIST,
      ROLES.NURSE,
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    subtitle: "Review stock and supplies",
    icon: Package,
    route: "/inventory",
    color: "bg-indigo-600",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PHARMACIST],
  },
  {
    id: "users",
    title: "Staff Users",
    subtitle: "Manage staff accounts and invitations",
    icon: UserCheck,
    route: "/users",
    color: "bg-slate-700",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    subtitle: "Configure staff access levels",
    icon: ShieldAlert,
    route: "/roles-permissions",
    color: "bg-slate-800",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  {
    id: "audit",
    title: "Audit Logs",
    subtitle: "Review clinic activity history",
    icon: History,
    route: "/audit-logs",
    color: "bg-gray-700",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
];

const statisticCards = [
  {
    id: "patients",
    label: "Total Patients",
    value: "totalPatients",
    route: "/patients",
    icon: Users,
    iconColor: "text-blue-600 bg-blue-50",
    allowedRoles: Object.values(ROLES),
  },
  {
    id: "prescriptions",
    label: "Pending Prescriptions",
    value: "pendingPrescriptions",
    route: "/pharmacy",
    icon: Clock,
    iconColor: "text-amber-600 bg-amber-50",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PHARMACIST],
  },
  {
    id: "stock",
    label: "Low Stock Items",
    value: "lowStockCount",
    route: "/inventory",
    icon: AlertTriangle,
    iconColor: "text-rose-600 bg-rose-50",
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PHARMACIST],
  },
  {
    id: "invoices",
    label: "Unpaid Invoices",
    value: "unpaidInvoiceCount",
    route: "/billing",
    icon: Receipt,
    iconColor: "text-purple-600 bg-purple-50",
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.RECEPTIONIST,
      ROLES.ACCOUNTANT,
    ],
  },
  {
    id: "beds",
    label: "Available Beds",
    value: "availableBeds",
    route: "/admissions",
    icon: Bed,
    iconColor: "text-emerald-600 bg-emerald-50",
    allowedRoles: [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.RECEPTIONIST,
      ROLES.NURSE,
    ],
    getValue: (stats) =>
      `${stats.availableBeds} / ${stats.totalBeds}`,
  },
];

const initialStats = {
  totalPatients: 0,
  pendingPrescriptions: 0,
  lowStockCount: 0,
  unpaidInvoiceCount: 0,
  availableBeds: 0,
  totalBeds: 0,
};

export default function Dashboard() {
  const { user, tenant } = useAuth();
  const userRole = user?.role?.toUpperCase() || "";
  const [stats, setStats] = useState(initialStats);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const visibleStats = statisticCards.filter((card) =>
    card.allowedRoles.includes(userRole),
  );
  const visibleModules = navigationCards.filter((card) =>
    card.allowedRoles.includes(userRole),
  );

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await API.get("/dashboard/summary");
        if (!data?.success || !data.stats) {
          throw new Error(data?.message || "Dashboard response was incomplete.");
        }
        if (active) {
          setStats({ ...initialStats, ...data.stats });
          setRecentPatients(data.recentPatients || []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load dashboard data.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const initialFetch = window.setTimeout(() => void loadDashboard(), 0);
    return () => {
      active = false;
      window.clearTimeout(initialFetch);
    };
  }, []);

  const displayName = user?.firstName || user?.name || "Staff";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {tenant?.name || "Clinic workspace"}
          </p>
          <h1 className="mt-1 text-xl font-bold md:text-2xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Your {userRole.replaceAll("_", " ").toLowerCase()} workspace
          </p>
        </div>
        <Link
          to="/patients/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100"
        >
          <UserPlus size={18} />
          Register patient
        </Link>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section aria-label="Clinic indicators">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {visibleStats.map((card) => {
            const Icon = card.icon;
            const value = card.getValue
              ? card.getValue(stats)
              : stats[card.value];
            return (
              <Link
                key={card.id}
                to={card.route}
                aria-label={`${card.label}: ${loading || error ? "unavailable" : value}. Open ${card.route.slice(1)}.`}
                className="group flex min-h-24 items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 sm:p-4"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500 sm:text-xs">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                    {loading || error ? "—" : value}
                  </p>
                </div>
                <div className={`shrink-0 rounded-lg p-2 ${card.iconColor}`}>
                  <Icon size={20} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
            Your workspace
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Quick links for the tools available to your role.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleModules.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                to={card.route}
                className="flex min-h-24 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-slate-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 active:scale-[0.99]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`shrink-0 rounded-lg p-2.5 text-white ${card.color}`}>
                    <Icon size={21} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900">{card.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{card.subtitle}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-gray-400" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-bold text-gray-900">Recently registered patients</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Select a patient to open their record.
            </p>
          </div>
          <Link
            to="/patients"
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <p className="p-5 text-center text-sm text-gray-500">
            Loading patient activity…
          </p>
        ) : error ? (
          <p className="p-5 text-center text-sm text-gray-500">
            Patient activity is unavailable.
          </p>
        ) : recentPatients.length === 0 ? (
          <p className="p-5 text-center text-sm text-gray-500">
            No recent patient registrations.
          </p>
        ) : (
          <>
            <ul className="divide-y md:hidden">
              {recentPatients.map((patient) => (
                <li key={patient._id}>
                  <Link
                    to={`/patients/${patient._id}`}
                    className="flex min-h-16 items-center justify-between gap-3 p-4 hover:bg-gray-50 focus:bg-gray-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {[patient.firstName, patient.lastName]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {patient.patientId || "No patient ID"}
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Patient ID</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3 text-right">Open record</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentPatients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {[patient.firstName, patient.lastName]
                          .filter(Boolean)
                          .join(" ")}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {patient.patientId || "—"}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">
                        {patient.gender || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/patients/${patient._id}`}
                          className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 font-semibold text-slate-800 hover:bg-slate-100"
                        >
                          Open <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
