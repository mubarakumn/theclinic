import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const emptyFormData = {
  firstName: '',
  lastName: '',
  gender: 'female',
  dateOfBirth: '',
  phone: '',
  address: '',
  physicalCardNumber: '',
};

const PatientForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [error, setError] = useState('');
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await API.post('/patients', formData);
      if (!data?.success || !data.data?.patientId) {
        throw new Error('The patient was not registered. Please try again.');
      }
      setRegisteredPatient(data.data);
    } catch (err) {
      console.error('Error registering patient:', err);
      if (err.code === 'OFFLINE_QUEUED') {
        setQueuedOffline(true);
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registeredPatient) {
    return (
      <main className="mx-auto max-w-xl space-y-5 p-4 sm:p-6">
        <section className="rounded-xl border bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-semibold text-emerald-700">Patient registered successfully</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {registeredPatient.firstName} {registeredPatient.lastName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This is the clinic tracking number for this patient. It is not a new physical card number.
          </p>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Clinic tracking number
            </p>
            <p className="mt-1 select-all break-all font-mono text-xl font-bold text-slate-900">
              {registeredPatient.patientId}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              You can write this number on the patient’s physical card and use it to find their clinic record.
            </p>
          </div>

          {registeredPatient.physicalCardNumber && (
            <p className="mt-4 text-sm text-gray-700">
              Existing physical card linked: <strong className="font-mono">{registeredPatient.physicalCardNumber}</strong>
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(`/patients/${encodeURIComponent(registeredPatient.patientId)}`)}
              className="min-h-11 flex-1 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open patient record
            </button>
            <button
              type="button"
              onClick={() => {
                setRegisteredPatient(null);
                setFormData(emptyFormData);
              }}
              className="min-h-11 rounded-lg border px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Register another
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 p-3 sm:p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">New patient registration</h1>
          <p className="mt-1 text-sm text-gray-600">
            A clinic tracking number is assigned after registration. No physical card number is generated.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="min-h-11 shrink-0 px-2 text-sm font-semibold text-gray-600 hover:underline"
        >
          Cancel
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {queuedOffline && (
        <div role="status" className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Registration saved on this device and waiting to sync.</p>
          <p>The clinic tracking number will be assigned by the server after synchronization.</p>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="min-h-11 font-semibold underline"
          >
            Return to patient directory
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">
            First name *
            <input
              type="text"
              name="firstName"
              required
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 min-h-11 w-full rounded-lg border p-3 text-base font-normal outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>

          <label className="text-sm font-semibold text-gray-700">
            Last name / surname *
            <input
              type="text"
              name="lastName"
              required
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 min-h-11 w-full rounded-lg border p-3 text-base font-normal outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>

          <label className="text-sm font-semibold text-gray-700">
            Gender *
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="mt-1 min-h-11 w-full rounded-lg border p-3 text-base font-normal outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="text-sm font-semibold text-gray-700">
            Date of birth *
            <input
              type="date"
              name="dateOfBirth"
              required
              autoComplete="bday"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="mt-1 min-h-11 w-full rounded-lg border p-3 text-base font-normal outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>

          <label className="text-sm font-semibold text-gray-700">
            Phone number *
            <input
              type="tel"
              name="phone"
              required
              autoComplete="tel"
              placeholder="+234..."
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 min-h-11 w-full rounded-lg border p-3 text-base font-normal outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>

          <label className="text-sm font-semibold text-gray-700">
            Existing physical card number
            <input
              type="text"
              name="physicalCardNumber"
              autoComplete="off"
              value={formData.physicalCardNumber}
              onChange={handleChange}
              placeholder="Optional — enter only if the patient already has a card"
              className="mt-1 min-h-11 w-full rounded-lg border p-3 text-base font-normal outline-none focus:ring-2 focus:ring-slate-900"
            />
            <span className="mt-1 block text-xs font-normal text-gray-500">
              This links an existing card number; the system will not create one.
            </span>
          </label>

          <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
            Residential address
            <input
              type="text"
              name="address"
              autoComplete="street-address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 min-h-11 w-full rounded-lg border p-3 text-base font-normal outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="min-h-11 rounded-lg border px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || queuedOffline}
            className="min-h-11 rounded-lg bg-slate-900 px-6 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Registering patient…' : 'Register patient'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default PatientForm;
