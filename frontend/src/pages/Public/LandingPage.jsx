import React from "react";
import { Link } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Modern Hospital Management System
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 mt-6 leading-tight">
            Run Your Clinic Efficiently. <br />
            <span className="text-blue-600">No Paperwork. No Hassle.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            From patient registration to billing, pharmacy dispensing, and lab
            reports — manage your entire medical practice in one cloud-based
            platform.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              to="/register-clinic"
              className="bg-blue-600 text-white font-semibold text-lg px-8 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Start 14-Day Free Trial
            </Link>
            <Link
              to="/features"
              className="bg-gray-100 text-gray-700 font-semibold text-lg px-8 py-3 rounded-lg hover:bg-gray-200 transition"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Why Clinics Trust Clinic HMS
          </h2>
          <p className="text-gray-600 mt-2">
            Built specifically for healthcare teams demanding speed and absolute
            reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl mb-4">
              📋
            </div>
            <h3 className="text-xl font-bold mb-2">Unified Patient Records</h3>
            <p className="text-gray-600 text-sm">
              Keep patient medical history, vitals, lab reports, and
              prescriptions linked seamlessly under a single file.
            </p>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold text-xl mb-4">
              💳
            </div>
            <h3 className="text-xl font-bold mb-2">
              Automated Billing & Receipts
            </h3>
            <p className="text-gray-600 text-sm">
              Generate clear itemized invoices for consultation, lab tests, and
              medications. Print receipts instantly.
            </p>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold text-xl mb-4">
              📱
            </div>
            <h3 className="text-xl font-bold mb-2">Mobile PWA Ready</h3>
            <p className="text-gray-600 text-sm">
              Install Clinic HMS directly onto your phone or tablet. Your staff
              can enter data on-the-go anywhere in the clinic.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="bg-blue-600 py-16 text-center text-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold">
            Ready to modernize your healthcare operations?
          </h2>
          <p className="mt-4 text-blue-100 text-lg">
            Join hundreds of healthcare professionals reducing waiting times and
            improving patient care today.
          </p>
          <div className="mt-8">
            <Link
              to="/register-clinic"
              className="bg-white text-blue-600 font-bold text-lg px-8 py-3 rounded-lg hover:bg-gray-100 transition shadow-md"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm border-t border-gray-800">
        <p>
          &copy; {new Date().getFullYear()} Clinic HMS. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
