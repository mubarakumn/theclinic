import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";

export default function Header({ onMenuClick, isMobile }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  return (
    <header className="flex items-center justify-between md:justify-end px-6 py-5 bg-white border-b border-slate-200">
      {isMobile && (
        <button
          className="text-gray-500 focus:outline-none md:hidden"
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
      )}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          {user?.firstName} ({user?.role})
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-slate-900"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
