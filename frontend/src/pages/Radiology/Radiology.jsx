import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';

const Radiology = () => {
  const [orders, setOrders] = useState([]);
  const [findings, setFindings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get('/radiology');
      setOrders(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load radiology orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchOrders();
    }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchOrders]);

  const saveReport = async (order) => {
    const value = findings[order._id] ?? order.findings ?? '';
    if (!value.trim()) {
      setError('Enter report findings before saving.');
      return;
    }

    try {
      setSavingId(order._id);
      setError('');
      const { data } = await API.patch(`/radiology/${order._id}/report`, { findings: value });
      setOrders((current) => current.map((item) => item._id === order._id ? data.data : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save radiology report.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Radiology & Diagnostic Imaging</h1>
        <p className="text-sm text-gray-500">Ultrasound (USS), X-ray, and CT scan reporting workstation.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading radiology orders...</p>
      ) : orders.length === 0 ? (
        <p className="rounded-lg border bg-white p-5 text-sm text-gray-500">No radiology orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const patient = order.patientId;
            const doctor = order.doctorId;
            const completed = order.status === 'COMPLETED';

            return (
              <div key={order._id} className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  {patient?._id ? (
                    <Link
                      to={`/patients/${encodeURIComponent(patient.patientId)}`}
                      className="min-h-11 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="block font-mono text-xs font-bold text-blue-700">
                        {patient.patientId}
                      </span>
                      <strong className="text-sm text-gray-900">
                        {[patient.firstName, patient.lastName].filter(Boolean).join(' ')}
                      </strong>
                      <span className="ml-2 text-xs font-semibold text-blue-700">View patient</span>
                    </Link>
                  ) : (
                    <strong className="text-sm text-gray-900">Patient unavailable</strong>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded font-bold ${
                    completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Imaging Type</p>
                  <p className="text-base font-bold text-blue-900">{order.scanType} — {order.bodyPart}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Requested by: {doctor ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') : '—'}
                  </p>
                  {order.clinicalNotes && <p className="mt-2 text-sm text-gray-600">{order.clinicalNotes}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-400 uppercase font-bold">Radiologist Findings</label>
                  <div className="mt-1 flex gap-2">
                    <textarea
                      rows="3"
                      value={findings[order._id] ?? order.findings ?? ''}
                      disabled={completed}
                      onChange={(e) => setFindings((current) => ({ ...current, [order._id]: e.target.value }))}
                      className="w-full rounded-lg border bg-gray-50 p-3 text-sm text-gray-800 disabled:opacity-80"
                    />
                    {!completed && (
                      <button
                        type="button"
                        disabled={savingId === order._id}
                        onClick={() => saveReport(order)}
                        className="self-end rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingId === order._id ? 'Saving...' : 'Save report'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Radiology;
