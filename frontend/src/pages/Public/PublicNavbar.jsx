import React from "react";
import { Link, useLocation } from "react-router-dom";

const PublicNavbar = () => {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600 font-bold"
      : "text-gray-600 hover:text-blue-600";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className="text-2xl font-extrabold text-blue-600 tracking-tight"
            >
              Clinic <span className="text-gray-800">HMS</span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-8 text-sm font-medium">
            <Link to="/" className={isActive("/")}>
              Home
            </Link>
            <Link to="/features" className={isActive("/features")}>
              Features
            </Link>
            <Link to="/pricing" className={isActive("/pricing")}>
              Pricing
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2"
            >
              Log in
            </Link>
            <Link
              to="/register-clinic"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
