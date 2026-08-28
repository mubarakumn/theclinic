import React, { useState } from 'react';
import PublicNavbar from './PublicNavbar';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-600 mt-4">Pick a plan that matches your clinic's scale. Upgrade or cancel anytime.</p>

        {/* Toggle Billing */}
        <div className="mt-8 flex justify-center items-center space-x-4">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 bg-blue-600 rounded-full p-1 transition duration-200 ease-in-out"
          >
            <div className={`w-4 h-4 bg-white rounded-full transition transform ${billingCycle === 'yearly' ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Yearly Billing <span className="text-green-600 font-bold">(Save 20%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-left">
            <h3 className="text-xl font-bold text-gray-900">Standard Clinic</h3>
            <p className="text-sm text-gray-500 mt-1">Ideal for small clinics and private practices.</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold text-gray-900">
                {billingCycle === 'monthly' ? '$49' : '$39'}
              </span>
              <span className="text-gray-500 text-sm"> / month</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 mb-8">
              <li>✓ Up to 10 Staff Accounts</li>
              <li>✓ Full Patient & EMR Access</li>
              <li>✓ Pharmacy & Billing Modules</li>
              <li>✓ Printable Reports</li>
              <li>✓ Mobile PWA Access</li>
            </ul>
            <Link
              to="/register-clinic"
              className="block text-center w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Growth Plan */}
          <div className="bg-white p-8 rounded-2xl border-2 border-blue-600 shadow-md text-left relative">
            <span className="absolute -top-3 right-6 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
              Popular
            </span>
            <h3 className="text-xl font-bold text-gray-900">Hospital / Medical Center</h3>
            <p className="text-sm text-gray-500 mt-1">Designed for growing medical centers with multiple wards.</p>
            <div className="my-6">
              <span className="text-4xl font-extrabold text-gray-900">
                {billingCycle === 'monthly' ? '$99' : '$79'}
              </span>
              <span className="text-gray-500 text-sm"> / month</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 mb-8">
              <li>✓ Unlimited Staff Accounts</li>
              <li>✓ All Standard Features Included</li>
              <li>✓ Laboratory & Radiology Modules</li>
              <li>✓ Ward & Bed Management</li>
              <li>✓ Priority Technical Support</li>
            </ul>
            <Link
              to="/register-clinic"
              className="block text-center w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;