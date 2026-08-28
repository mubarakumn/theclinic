import React, { useState, useEffect } from "react";
import API from "../../api";

const SubscriptionSettings = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    try {
      const res = await API.get("/subscription/status");
      setSubscription(res.data);
    } catch (err) {
      console.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async (planType) => {
    try {
      const res = await API.post("/subscription/initialize-payment", {
        plan: planType,
      });
      // Redirect clinic admin to Paystack checkout URL
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err) {
      alert("Could not initialize payment. Please try again.");
    }
  };

  if (loading) return <div className="p-8">Loading subscription data...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Clinic Subscription</h1>
      <p className="text-gray-600 mb-6">
        Manage your plan, billing cycle, and payment history.
      </p>

      {/* Current Plan Status Card */}
      <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
              Current Status: {subscription?.status || "Active Trial"}
            </span>
            <h2 className="text-xl font-bold mt-2">
              {subscription?.planName || "Standard Trial Plan"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Expires on:{" "}
              {subscription?.endDate
                ? new Date(subscription.endDate).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-gray-900">
              {subscription?.daysLeft || 14} Days Left
            </span>
          </div>
        </div>
      </div>

      {/* Plans Selection */}
      <h2 className="text-lg font-bold mb-4">Choose a Subscription Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border hover:border-blue-500 transition">
          <h3 className="font-bold text-lg">Standard Clinic Plan</h3>
          <p className="text-2xl font-extrabold text-gray-900 my-2">
            $39 <span className="text-xs text-gray-500">/ month</span>
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6">
            <li>✓ Up to 10 Staff Accounts</li>
            <li>✓ Patient Records & Pharmacy</li>
            <li>✓ Billing & Financial Receipts</li>
          </ul>
          <button
            onClick={() => handlePaystackPayment("standard")}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
          >
            Renew / Upgrade Standard
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-blue-600 shadow-sm">
          <h3 className="font-bold text-lg">Growth Hospital Plan</h3>
          <p className="text-2xl font-extrabold text-gray-900 my-2">
            $79 <span className="text-xs text-gray-500">/ month</span>
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6">
            <li>✓ Unlimited Staff Accounts</li>
            <li>✓ All Standard Features Included</li>
            <li>✓ Laboratory & Ward Management</li>
          </ul>
          <button
            onClick={() => handlePaystackPayment("growth")}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
          >
            Upgrade to Growth
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSettings;
