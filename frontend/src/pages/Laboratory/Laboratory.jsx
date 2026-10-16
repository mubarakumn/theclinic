import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';

const Laboratory = () => {
  const [orders, setOrders] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get('/lab');
      setOrders(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load laboratory orders.');
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

  const saveResult = async (order) => {
    const value = results[order._id] ?? order.results ?? '';
    if (!value.trim()) {
      setError('Enter a result before saving.');
      return;
    }

    try {
      setSavingId(order._id);
      setError('');
      const { data } = await API.patch(`/lab/${order._id}/results`, { results: value });
      setOrders((current) => current.map((item) => item._id === order._id ? data.data : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save laboratory result.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laboratory Workstation</h1>
        <p className="text-sm text-gray-500">Incoming physician test orders, specimen tracking, and result entry.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading laboratory orders...</p>
      ) : orders.length === 0 ? (
        <p className="rounded-lg border bg-white p-5 text-sm text-gray-500">No laboratory orders found.</p>
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
                      className="min-h-11 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <span className="block font-mono text-xs font-bold text-blue-700">
                        {patient.patientId}
                      </span>
                      <strong className="text-sm text-gray-900">
                        {[patient.firstName, patient.lastName].filter(Boolean).join(' ')}
                      </strong>
                      <span className="ml-2 text-xs font-semibold text-purple-700">View patient</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Ordered Test</p>
                    <p className="text-base font-bold text-purple-900">{order.testName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Requested by: {doctor ? [doctor.firstName, doctor.lastName].filter(Boolean).join(' ') : '—'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Test Result Findings
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={results[order._id] ?? order.results ?? ''}
                        disabled={completed}
                        onChange={(e) => setResults((current) => ({ ...current, [order._id]: e.target.value }))}
                        className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                      />
                      {!completed && (
                        <button
                          type="button"
                          disabled={savingId === order._id}
                          onClick={() => saveResult(order)}
                          className="rounded-lg bg-purple-600 px-4 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                          {savingId === order._id ? 'Saving...' : 'Save'}
                        </button>
                      )}
                    </div>
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

export default Laboratory;
