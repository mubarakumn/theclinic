import React from 'react';
import PublicNavbar from './PublicNavbar';
import { Link } from 'react-router-dom';

const Features = () => {
  const modules = [
    { name: 'Patient Management', desc: 'Register patients, manage profiles, track medical history, and search records in seconds.' },
    { name: 'Medical Records & EMR', desc: 'Record doctor notes, clinical diagnoses, vitals, and issue digital prescriptions.' },
    { name: 'Pharmacy & Inventory', desc: 'Track drug stock levels, receive low inventory alerts, and handle medication dispensing.' },
    { name: 'Laboratory & Radiology', desc: 'Order diagnostic tests, record results, and attach printable lab reports.' },
    { name: 'Billing & Cashier Ops', desc: 'Calculate invoice totals, record cash/card payments, and print thermal or PDF receipts.' },
    { name: 'Inpatient Admissions', desc: 'Manage ward beds, track patient admissions, and oversee daily care logs.' },
    { name: 'Role-Based Staff Access', desc: 'Assign strict operational roles (Doctor, Nurse, Pharmacist, Receptionist) to keep data safe.' },
    { name: 'Audit Logs & Security', desc: 'Maintain complete data transparency with automated system activity logs.' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900">Comprehensive Clinical Modules</h1>
          <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
            Everything your hospital staff needs to operate efficiently without technological complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {modules.map((m, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start space-x-4">
              <div className="bg-blue-50 text-blue-600 font-bold text-lg p-3 rounded-lg">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/register-clinic"
            className="bg-blue-600 text-white font-semibold text-lg px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Start Your 14-Day Trial
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Features;