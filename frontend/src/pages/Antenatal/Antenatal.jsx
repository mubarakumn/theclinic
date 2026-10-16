import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';

const emptyVisit = { fundalHeightCm: '', fetalHeartRate: '', bloodPressure: '', weightKg: '', notes: '' };

const Antenatal = () => {
  const [records, setRecords] = useState([]);
  const [visits, setVisits] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get('/antenatal');
      setRecords(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load antenatal records.');
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

  const saveVisit = async (record) => {
    const visit = visits[record._id] || emptyVisit;
    try {
      setSavingId(record._id);
      setError('');
      const payload = Object.fromEntries(
        Object.entries(visit).filter(([, value]) => value !== '').map(([key, value]) => [
          key,
          ['fundalHeightCm', 'fetalHeartRate', 'weightKg'].includes(key) ? Number(value) : value,
        ])
      );
      const { data } = await API.post(`/antenatal/${record._id}/visits`, payload);
      setRecords((current) => current.map((item) => item._id === record._id ? data.data : item));
      setVisits((current) => ({ ...current, [record._id]: emptyVisit }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save antenatal visit.');
    } finally {
      setSavingId('');
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '—';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-purple-900">Antenatal Care (ANC) Clinic</h1>
        <p className="text-sm text-gray-500">Maternal health tracking, gestational milestones, and prenatal schedules.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading antenatal records...</p>
      ) : records.length === 0 ? (
        <p className="rounded-lg border bg-white p-5 text-sm text-gray-500">No antenatal records found.</p>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const patient = record.patientId;
            const latestVisit = record.visits?.[record.visits.length - 1];
            const visit = visits[record._id] || emptyVisit;
            const gestationalWeeks = record.gestationalAgeWeeks;

            return (
              <section key={record._id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b bg-purple-50 text-xs font-bold uppercase text-purple-900">
                      <tr>
                        <th className="p-4">ANC / MRN</th>
                        <th className="p-4">Patient Name</th>
                        <th className="p-4">Gravida / Para</th>
                        <th className="p-4">Gestational Age</th>
                        <th className="p-4">EDD</th>
                        <th className="p-4">Latest Visit</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-4 font-mono font-bold text-purple-800">
                          {record.ancNumber} <span className="text-gray-400">/ {patient?.patientId || '—'}</span>
                        </td>
                        <td className="p-4 font-bold text-gray-900">
                          {patient?._id ? (
                            <Link
                              to={`/patients/${encodeURIComponent(patient.patientId)}`}
                              className="inline-flex min-h-11 items-center text-blue-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              {[patient.firstName, patient.lastName].filter(Boolean).join(' ')}
                            </Link>
                          ) : 'Patient unavailable'}
                        </td>
                        <td className="p-4 font-semibold text-gray-600">G{record.gravida} P{record.para}</td>
                        <td className="p-4">
                          {gestationalWeeks == null ? '—' : `${gestationalWeeks} weeks`}
                        </td>
                        <td className="p-4 text-xs font-mono">{formatDate(record.edd)}</td>
                        <td className="p-4 text-xs text-gray-700">
                          {latestVisit
                            ? `${latestVisit.fetalHeartRate || '—'} bpm / ${latestVisit.fundalHeightCm || '—'} cm`
                            : 'No visits yet'}
                        </td>
                        <td className="p-4 font-bold text-xs">{record.status}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t bg-gray-50 p-4 md:grid-cols-6">
                  {[
                    ['fundalHeightCm', 'Fundal height (cm)', 'number'],
                    ['fetalHeartRate', 'Fetal heart rate', 'number'],
                    ['bloodPressure', 'Blood pressure', 'text'],
                    ['weightKg', 'Weight (kg)', 'number'],
                  ].map(([key, label, type]) => (
                    <label key={key} className="text-xs font-semibold text-gray-600">
                      {label}
                      <input
                        type={type}
                        value={visit[key]}
                        onChange={(event) => setVisits((current) => ({
                          ...current,
                          [record._id]: { ...emptyVisit, ...current[record._id], [key]: event.target.value },
                        }))}
                        className="mt-1 w-full rounded border p-2 text-sm"
                      />
                    </label>
                  ))}
                  <label className="text-xs font-semibold text-gray-600 md:col-span-2">
                    Visit notes
                    <input
                      value={visit.notes}
                      onChange={(event) => setVisits((current) => ({
                        ...current,
                        [record._id]: { ...emptyVisit, ...current[record._id], notes: event.target.value },
                      }))}
                      className="mt-1 w-full rounded border p-2 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={savingId === record._id}
                    onClick={() => saveVisit(record)}
                    className="self-end rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {savingId === record._id ? 'Saving...' : 'Record visit'}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Antenatal;
