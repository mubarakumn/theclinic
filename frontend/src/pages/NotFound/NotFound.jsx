import { Link } from "react-router-dom";
import { ArrowLeft, CircleHelp } from "lucide-react";

const NotFound = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12 text-center">
      <CircleHelp aria-hidden="true" className="mb-5 h-16 w-16 text-slate-400" />
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-base text-slate-600">
        The page you are looking for may have moved, or the address may be
        incorrect.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to home
      </Link>
    </main>
  );
};

export default NotFound;
