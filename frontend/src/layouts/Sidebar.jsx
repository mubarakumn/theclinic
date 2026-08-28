import { useEffect, useRef } from "react";
import NavigationItems from "./NavigationItems";
import { Activity, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const SidebarContent = ({ onNavigate, tenant }) => (
  <>
    <div className="flex items-center justify-center p-5 border-b border-slate-700 gap-2">
      <Activity className="text-white" />
      <span className="text-lg font-semibold">{tenant?.name || "Clinic"}</span>
    </div>
    <NavigationItems onNavigate={onNavigate} />
  </>
);

export default function Sidebar({
  isMobile,
  isDrawerOpen,
  onClose,
  onNavigate,
}) {
  const sidebarRef = useRef(null);
  const { tenant } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDrawerOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape" && isDrawerOpen) {
        onClose();
      }
    };

    if (isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDrawerOpen, onClose, isMobile]);

  if (isMobile) {
    return (
      <>
        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/60 blur z-30"
            onClick={onClose}
          />
        )}
        <aside
          ref={sidebarRef}
          className={`fixed top-0 left-0 w-64 h-full bg-white z-40 transform transition-transform ease-in-out duration-300 ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X size={24} className="mt-1" />
          </button>
          <SidebarContent onNavigate={onNavigate} />
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-700">
      <SidebarContent tenant={tenant}/>
    </aside>
  );
}
