import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen -mt-16 text-center p-4">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Access Denied</h1>
      <p className="text-lg text-gray-600 mb-8">
        You do not have permission to view this page.
      </p>
      <Link
        to="/dashboard"
        className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
