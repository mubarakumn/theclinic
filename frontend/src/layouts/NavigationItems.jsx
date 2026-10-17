import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  HeartPulse,
  FlaskConical,
  Scan,
  Pill,
  CreditCard,
  Bed,
  Warehouse,
  UserCog,
  ShieldCheck,
  History,
  Tags,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ROLES, ALL_ROLES } from "../routes/roles";

const navigationConfig = [
  { title: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} />, allowedRoles: ALL_ROLES },
  {
    title: "PATIENT CARE",
    group: true,
    allowedRoles: ALL_ROLES,
    children: [
      { title: "Patients", path: "/patients", icon: <Users size={20} />, allowedRoles: ALL_ROLES },
      { title: "Medical Records", path: "/medical-records", icon: <FileText size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE] },
      { title: "Antenatal", path: "/antenatal", icon: <HeartPulse size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE] },
    ],
  },
  {
    title: "SERVICES",
    group: true,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB_TECH, ROLES.RADIOLOGIST, ROLES.PHARMACIST],
    children: [
      { title: "Laboratory", path: "/laboratory", icon: <FlaskConical size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB_TECH] },
      { title: "Radiology / Scan", path: "/radiology", icon: <Scan size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGIST] },
      { title: "Pharmacy", path: "/pharmacy", icon: <Pill size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PHARMACIST] },
    ],
  },
  {
    title: "OPERATIONS",
    group: true,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT, ROLES.NURSE, ROLES.PHARMACIST],
    children: [
      { title: "Billing", path: "/billing", icon: <CreditCard size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT] },
      { title: "Admissions / Wards", path: "/admissions", icon: <Bed size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.NURSE] },
      { title: "Inventory", path: "/inventory", icon: <Warehouse size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PHARMACIST] },
    ],
  },
  {
    title: "ADMINISTRATION",
    group: true,
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT],
    children: [
      { title: "Users", path: "/users", icon: <UserCog size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
      { title: "Roles & Permissions", path: "/roles-permissions", icon: <ShieldCheck size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
      { title: "Service Prices", path: "/services-price-list", icon: <Tags size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT] },
      { title: "Audit Logs", path: "/audit-logs", icon: <History size={20} />, allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
    ],
  },
];

export default function NavigationItems({ onNavigate }) {
  const { user } = useAuth();
  const userRole = user?.role ? user.role.toUpperCase() : "GUEST";

  const hasAccess = (allowedRoles) => {
    if (!allowedRoles) return true;
    if (userRole === "SUPER_ADMIN") return true;
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
    return normalizedAllowed.includes(userRole);
  };

  return (
    <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
      {navigationConfig.map((item, index) => {
        if (!hasAccess(item.allowedRoles)) return null;

        if (item.group) {
          const visibleChildren = item.children.filter((c) => hasAccess(c.allowedRoles));
          if (visibleChildren.length === 0) return null;

          return (
            <div key={index}>
              <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {item.title}
              </h3>
              {visibleChildren.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-gray-300 hover:bg-slate-700 hover:text-white"
                    }`
                  }
                >
                  {child.icon}
                  <span>{child.title}</span>
                </NavLink>
              ))}
            </div>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-gray-300 hover:bg-slate-700 hover:text-white"
              }`
            }
          >
            {item.icon}
            <span>{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}