import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterClinic() {
  const navigate = useNavigate();
  const { registerTenant } = useAuth();
  const [formData, setFormData] = useState({
    clinicName: '',
    clinicCode: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await registerTenant(formData);
      if ( res.status === 201 ){
        setMessage(res.message);
        navigate(`/login?clinic=${encodeURIComponent(formData.clinicCode.trim())}`);
      }else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-slate-900">Register Your Clinic</h2>
        <p className="mt-2 text-sm text-slate-600">Start managing your facility with multi-tenant EMR</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
          {message && <div className="mb-4 text-sm text-green-600 bg-red-50 p-3 rounded">{message}</div>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Clinic Name</label>
              <input name="clinicName" type="text" required value={formData.clinicName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Clinic Short Code (e.g., FMC)</label>
              <input name="clinicCode" type="text" required value={formData.clinicCode} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Admin First Name</label>
                <input name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Admin Last Name</label>
                <input name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input name="phone" type="text" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input name="password" type="password" required value={formData.password} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
            </div>
            <button type="submit" disabled={submitting} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow">
              {submitting ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}