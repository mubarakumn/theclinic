import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionExpired = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl space-y-6">
        {/* Warning Icon Header */}
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">
          ⚠️
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Subscription Expired</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your clinic’s subscription plan has ended. Access to clinical records, billing, and departmental workflows has been temporarily paused.
          </p>
        </div>

        {/* Plan Status Card */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Status</span>
            <span className="text-red-400 font-bold uppercase tracking-wide">Inactive / Grace Period</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Account ID</span>
            <span className="text-slate-200 font-mono">CLN-2026-8801</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            Renew or Upgrade Plan
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm py-3 rounded-xl transition"
          >
            Switch Account / Log Out
          </button>
        </div>

        {/* Support Link */}
        <p className="text-xs text-slate-500">
          Need help? Contact support at{' '}
          <a href="mailto:support@yourclinicapp.com" className="text-blue-400 hover:underline">
            support@yourclinicapp.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionExpired;