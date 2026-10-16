import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const { acceptStaffInvitation } = useAuth();
  const [invitationToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token"));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!invitationToken) {
      setError("This invitation link is missing its secure token. Ask your clinic administrator to send a new invitation.");
      return;
    }
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await acceptStaffInvitation(invitationToken, password);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not set up your account. Please ask your clinic administrator for a new invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Set up your staff account</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a password to securely join your clinic workspace.</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form onSubmit={handleSubmit} className="bg-white py-8 px-4 shadow rounded-lg sm:px-10 space-y-5">
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">New password</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 block w-full rounded-md border-slate-300 border p-2 shadow-sm" />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">Confirm password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 block w-full rounded-md border-slate-300 border p-2 shadow-sm" />
          </div>
          <button type="submit" disabled={submitting || !invitationToken} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow disabled:opacity-50">
            {submitting ? "Setting up account..." : "Create password and continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
