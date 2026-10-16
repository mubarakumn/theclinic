import { useCallback, useEffect, useState } from 'react';
import API from '../../api';

const emptyVitals = { bloodPressure: '', pulseRate: '', temperature: '', weight: '' };

const MedicalRecords = () => {
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [vitals, setVitals] = useState(emptyVitals);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const patientResponse = await API.get('/patients');
      setPatients(patientResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patients.');
    }

    try {
      const recordResponse = await API.get('/medical-records');
      setRecords(recordResponse.data.data || []);
    } catch (err) {
      setRecords([]);
      if (navigator.onLine) {
        setError(err.response?.data?.message || 'Failed to load medical records.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchRecords();
    }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchRecords]);

  const saveConsultation = async (event) => {
    event.preventDefault();
    if (!patientId) {
      setError('Select a patient before saving the encounter.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      const vitalsData = {
        bloodPressure: vitals.bloodPressure,
        pulseRate: vitals.pulseRate === '' ? undefined : Number(vitals.pulseRate),
        temperature: vitals.temperature === '' ? undefined : Number(vitals.temperature),
        weight: vitals.weight === '' ? undefined : Number(vitals.weight),
      };
      const vitalsOnly = [
        chiefComplaint,
        consultationNotes,
        diagnosis,
        treatmentPlan,
      ].every((value) => !value.trim());
      const encounterData = {
        patientId,
        vitals: vitalsData,
      };
      if (!vitalsOnly) {
        Object.assign(encounterData, {
          chiefComplaint,
          consultationNotes,
          diagnosis,
          treatmentPlan,
        });
      }
      const { data } = await API.post('/medical-records/encounter', encounterData);
      if (data?.pendingSync) {
        setVitals(emptyVitals);
        setMessage('Vitals saved on this device and waiting to sync.');
        return;
      }
      setRecords((current) => [data.data, ...current]);
      setChiefComplaint('');
      setConsultationNotes('');
      setDiagnosis('');
      setTreatmentPlan('');
      setVitals(emptyVitals);
      setMessage('Encounter saved.');
    } catch (err) {
      if (err.code === 'OFFLINE_QUEUED') {
        setVitals(emptyVitals);
        setMessage('Vitals saved on this device and waiting to sync.');
      } else {
        setError(err.response?.data?.message || 'Failed to save encounter.');
      }
    } finally {
      setSaving(false);
    }
  };

  const patientName = (patient) => [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') || 'Patient unavailable';
  const formatDate = (date) => date ? new Date(date).toLocaleString() : '—';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Records & Encounters</h1>
        <p className="text-sm text-gray-500">Document patient consultations and review saved encounter records.</p>
      </div>

      {!online && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Offline mode: patient selection and vital-sign entries are available from saved data.
          Consultation notes, diagnoses, and treatment plans need a connection.
        </p>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}

      <form onSubmit={saveConsultation} className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="border-b pb-2 font-bold text-gray-900">Record Encounter</h2>
        <label className="block text-xs font-bold uppercase text-gray-600">
          Patient
          <select
            required
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            className="mt-1 w-full rounded-lg border p-2 text-sm font-normal normal-case"
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patientName(patient)} — {patient.patientId}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['bloodPressure', 'Blood pressure', 'text'],
            ['pulseRate', 'Pulse (bpm)', 'number'],
            ['temperature', 'Temperature (°C)', 'number'],
            ['weight', 'Weight (kg)', 'number'],
          ].map(([key, label, type]) => (
            <label key={key} className="text-xs font-bold uppercase text-gray-600">
              {label}
              <input
                type={type}
                value={vitals[key]}
                onChange={(event) => setVitals((current) => ({ ...current, [key]: event.target.value }))}
                className="mt-1 w-full rounded-lg border p-2 text-sm font-normal normal-case"
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['Chief complaint', chiefComplaint, setChiefComplaint],
            ['Consultation notes', consultationNotes, setConsultationNotes],
            ['Diagnosis', diagnosis, setDiagnosis],
            ['Treatment plan', treatmentPlan, setTreatmentPlan],
          ].map(([label, value, setter]) => (
            <label key={label} className="text-xs font-bold uppercase text-gray-600">
              {label}
              <textarea
                rows="3"
                value={value}
                onChange={(event) => setter(event.target.value)}
                className="mt-1 w-full rounded-lg border p-2 text-sm font-normal normal-case"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || loading || patients.length === 0}
            className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Encounter'}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="font-bold text-gray-900">Recent Medical Records</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading records...</p>
        ) : records.length === 0 ? (
          <p className="rounded-lg border bg-white p-5 text-sm text-gray-500">No medical records found.</p>
        ) : records.map((record) => (
          <article key={record._id} className="space-y-2 rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold text-gray-900">{patientName(record.patientId)}</p>
                <p className="text-xs text-gray-500">
                  {record.patientId?.patientId || '—'} · {formatDate(record.createdAt)}
                </p>
              </div>
              <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{record.status}</span>
            </div>
            {record.chiefComplaint && <p className="text-sm"><strong>Chief complaint:</strong> {record.chiefComplaint}</p>}
            {record.vitals && (
              <p className="text-xs text-gray-600">
                Vitals: {[
                  record.vitals.bloodPressure && `BP ${record.vitals.bloodPressure}`,
                  record.vitals.pulseRate && `Pulse ${record.vitals.pulseRate}`,
                  record.vitals.temperature && `Temp ${record.vitals.temperature}°C`,
                  record.vitals.weight && `Weight ${record.vitals.weight}kg`,
                ].filter(Boolean).join(' · ') || 'Not recorded'}
              </p>
            )}
            {record.consultationNotes && <p className="text-sm text-gray-700">{record.consultationNotes}</p>}
            {record.diagnosis && <p className="text-sm"><strong>Diagnosis:</strong> {record.diagnosis}</p>}
            {record.treatmentPlan && <p className="text-sm"><strong>Treatment plan:</strong> {record.treatmentPlan}</p>}
          </article>
        ))}
      </section>
    </div>
  );
};

export default MedicalRecords;
