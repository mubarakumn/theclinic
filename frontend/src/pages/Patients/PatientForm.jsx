import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const PatientForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [queuedOffline, setQueuedOffline] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'female',
    dateOfBirth: '',
    phone: '',
    address: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await API.post('/patients', formData);
      if (data?.success) {
        alert(`Patient Registered! Card MRN Assigned: ${data.data.mrn}`);
        navigate(`/patients/${data.data._id}`);
      }
    } catch (err) {
      console.error('Error registering patient:', err);
      if (err.code === 'OFFLINE_QUEUED') {
        setQueuedOffline(true);
      } else {
        alert(err.response?.data?.message || 'Registration failed. Please check required fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">New Patient Registration</h1>
          <p className="text-xs text-gray-500">Creates a master health record and assigns an MRN card number.</p>
        </div>
        <button onClick={() => navigate('/patients')} className="text-xs font-semibold text-gray-600 hover:underline">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First Name *</label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last Name / Surname *</label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date of Birth *</label>
            <input
              type="date"
              name="dateOfBirth"
              required
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="+234..."
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Residential Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="px-5 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || queuedOffline}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
          >
            {loading
              ? 'Generating MRN Card...'
              : queuedOffline
                ? 'Saved locally — awaiting sync'
                : 'Complete & Print Card'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;