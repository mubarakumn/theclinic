import { useState, useEffect } from "react";
import { 
  Users, 
  FileText, 
  TestTube, 
  Pill, 
  Receipt, 
  Package, 
  UserCheck, 
  ShieldAlert, 
  History,
  UserPlus,
  Clock,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import API from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../routes/roles";

export default function Dashboard({ onNavigate }) {
  const { user, tenant } = useAuth();
  const userRole = user?.role?.toUpperCase() || "";
  const isAdmin = userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;

  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingPrescriptions: 0,
    lowStockCount: 0,
    unpaidInvoiceCount: 0,
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/dashboard/summary");
        if (data?.success) {
          setStats(data.stats || stats);
          setRecentPatients(data.recentPatients || []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const navigationCards = [
    {
      id: "patients",
      title: "Patients",
      subtitle: "Register & view patient profiles",
      icon: Users,
      route: "patients",
      color: "bg-blue-600",
      quickAction: { label: "+ Add", route: "patients/new" }
    },
    {
      id: "records",
      title: "Medical Records",
      subtitle: "Clinical notes & consultations",
      icon: FileText,
      route: "records",
      color: "bg-emerald-600",
    },
    {
      id: "laboratory",
      title: "Laboratory",
      subtitle: "Lab orders & diagnostics",
      icon: TestTube,
      route: "laboratory",
      color: "bg-sky-600",
    },
    {
      id: "pharmacy",
      title: "Pharmacy",
      subtitle: "Prescriptions & dispensing",
      icon: Pill,
      route: "pharmacy",
      color: "bg-amber-600",
    },
    {
      id: "billing",
      title: "Billing",
      subtitle: "Invoicing & payments",
      icon: Receipt,
      route: "billing",
      color: "bg-purple-600",
    },
    {
      id: "inventory",
      title: "Inventory",
      subtitle: "Stock & supply management",
      icon: Package,
      route: "inventory",
      color: "bg-indigo-600",
    },
    {
      id: "users",
      title: "Staff Users",
      subtitle: "Manage accounts & access",
      icon: UserCheck,
      route: "users",
      color: "bg-slate-700",
    },
  ];

  const adminCards = [
    {
      id: "roles",
      title: "Roles & Permissions",
      subtitle: "Configure user access levels",
      icon: ShieldAlert,
      route: "roles",
    },
    {
      id: "audit",
      title: "Audit Logs",
      subtitle: "System activity logs",
      icon: History,
      route: "audit",
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || "Staff"}
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Role: <span className="font-semibold uppercase">{user?.role}</span>
          </p>
        </div>
      </div>

      {/* TOP LEVEL: Live Operational Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Patients</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Pending Rx</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.pendingPrescriptions}</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Low Stock</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Unpaid Invoices</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.unpaidInvoiceCount}</p>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Receipt size={20} />
          </div>
        </div>
      </div>

      {/* MIDDLE LEVEL: Side-Nav Direct Access Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Quick Access Modules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigate?.(card.route)}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-slate-900 active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2.5 text-white rounded-lg ${card.color} shadow-sm`}>
                    <Icon size={22} />
                  </div>
                  {card.quickAction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate?.(card.quickAction.route);
                      }}
                      className="text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md font-medium hover:bg-slate-800 transition-colors"
                    >
                      {card.quickAction.label}
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-base">{card.title}</h3>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>Open</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Modules */}
      {isAdmin && (
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            System Administration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {adminCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => onNavigate?.(card.route)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-400 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 text-white rounded-lg">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{card.title}</h3>
                      <p className="text-xs text-gray-500">{card.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BOTTOM LEVEL: Recent Registrations Queue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-900">Recent Patients</h2>
          <button 
            onClick={() => onNavigate?.("patients")}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden space-y-3">
          {recentPatients.map((patient) => (
            <div 
              key={patient._id || patient.id}
              onClick={() => onNavigate?.(`patients/${patient._id || patient.id}`)}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center active:bg-gray-100 transition-colors"
            >
              <div>
                <p className="font-semibold text-sm text-gray-900">{patient.name}</p>
                <p className="text-xs text-gray-500">ID: {patient.cardNo || patient._id?.substring(0, 8)}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 font-medium rounded-full text-xs bg-slate-200 text-slate-800 capitalize">
                  {patient.gender || "Active"}
                </span>
              </div>
            </div>
          ))}
          {recentPatients.length === 0 && (
            <p className="text-xs text-center py-4 text-gray-400">No recent patient records found.</p>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
                <th className="py-2">Patient Name</th>
                <th className="py-2">Card No.</th>
                <th className="py-2">Gender</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentPatients.map((patient) => (
                <tr key={patient._id || patient.id} className="hover:bg-gray-50/50">
                  <td className="py-3 font-medium text-gray-900">{patient.name}</td>
                  <td className="py-3 text-gray-500">{patient.cardNo || "N/A"}</td>
                  <td className="py-3 text-gray-500 capitalize">{patient.gender || "N/A"}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onNavigate?.(`patients/${patient._id || patient.id}`)}
                      className="text-xs font-medium text-slate-900 hover:underline"
                    >
                      View Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Patient Registration Button (Mobile Only) */}
      <button
        onClick={() => onNavigate?.("patients/new")}
        aria-label="Register New Patient"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-800 active:scale-95 focus:outline-none z-50"
      >
        <UserPlus size={24} />
      </button>
    </div>
  );
}