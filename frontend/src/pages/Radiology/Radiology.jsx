import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const emptyOrder = {
  patientId: '',
  servicePriceId: '',
  bodyPart: '',
  clinicalNotes: '',
};

const Radiology = () => {
  const { role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [findings, setFindings] = useState({});
  const [newOrder, setNewOrder] = useState(emptyOrder);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [printReport, setPrintReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [savingAction, setSavingAction] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const canCreateOrders = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'].includes(role);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const requests = [API.get('/radiology')];
      if (canCreateOrders) {
        requests.push(API.get('/patients'));
        requests.push(API.get('/settings/tariffs', { params: { category: 'RADIOLOGY' } }));
      }
      const responses = await Promise.all(requests);
      setOrders(responses[0].data.data || []);
      if (canCreateOrders) {
        setPatients(responses[1].data.data || []);
        setTariffs((responses[2].data.data || []).filter((tariff) => tariff.isActive));
      } else {
        setPatients([]);
        setTariffs([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load radiology data.');
    } finally {
      setLoading(false);
    }
  }, [canCreateOrders]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchData]);

  const createOrder = async (event) => {
    event.preventDefault();
    if (
      !newOrder.patientId ||
      !newOrder.servicePriceId ||
      !newOrder.bodyPart.trim()
    ) {
      setError('Select a patient, an active imaging tariff, and a body part.');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setMessage('');
      const { data } = await API.post('/radiology', {
        ...newOrder,
        bodyPart: newOrder.bodyPart.trim(),
        clinicalNotes: newOrder.clinicalNotes.trim(),
      });
      setOrders((current) => [data.data, ...current]);
      setNewOrder(emptyOrder);
      setMessage('Radiology order created.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create radiology order.');
    } finally {
      setCreating(false);
    }
  };

  const saveReport = async (order, complete) => {
    const value = findings[order._id] ?? order.findings ?? '';
    if (!value.trim()) {
      setError('Enter report findings before completing the report.');
      return;
    }

    try {
      setSavingId(order._id);
      setSavingAction(complete ? 'complete' : 'draft');
      setError('');
      setMessage('');
      const { data } = await API.patch(`/radiology/${order._id}/report`, { findings: value, complete });
      setOrders((current) => current.map((item) => item._id === order._id ? data.data : item));
      setFindings((current) => ({ ...current, [order._id]: data.data.findings }));
      setMessage(complete ? 'Radiology report completed.' : 'Report draft saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save radiology report.');
    } finally {
      setSavingId('');
      setSavingAction('');
    }
  };

  const openPrintView = (order) => {
    setPrintReport(order);
    window.setTimeout(() => window.print(), 100);
  };

  const patientName = (patient) =>
    [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') || 'Patient unavailable';
  const requestedBy = (order) => patientName(order.doctorId);
  const reportedBy = (order) =>
    [order.reportedById?.firstName, order.reportedById?.lastName].filter(Boolean).join(' ') || '—';
  const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';
  const formatDateOnly = (value) =>
    value ? new Date(value).toLocaleDateString() : '—';
  const formatPrice = (value) =>
    Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const visibleOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const searchText = [
      patientName(order.patientId),
      order.patientId?.patientId,
      order.scanType,
      order.bodyPart,
    ].join(' ').toLowerCase();
    return matchesStatus && searchText.includes(search.trim().toLowerCase());
  });

  return (
    <>
      <style>{`
        .radiology-print { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          .radiology-print, .radiology-print * { visibility: visible !important; }
          .radiology-print {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            padding: 24px;
            color: #111;
            background: #fff;
            font: 12pt Arial, sans-serif;
          }
        }
      `}</style>
      <div className="radiology-screen p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Radiology &amp; Diagnostic Imaging</h1>
            <p className="text-sm text-gray-500">
              Create imaging orders, record findings, and print completed patient reports.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="min-h-11 rounded-lg border bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh orders'}
          </button>
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}

        {canCreateOrders && (
          <form onSubmit={createOrder} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="border-b pb-2 font-bold text-gray-900">Create imaging order</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold text-gray-600 lg:col-span-2">
                Patient
                <select
                  required
                  value={newOrder.patientId}
                  onChange={(event) => setNewOrder((current) => ({ ...current, patientId: event.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-lg border p-2 text-sm font-normal"
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName} — {patient.patientId}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-gray-600">
                Imaging service / tariff
                <select
                  required
                  value={newOrder.servicePriceId}
                  onChange={(event) => setNewOrder((current) => ({ ...current, servicePriceId: event.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-lg border p-2 text-sm font-normal"
                >
                  <option value="">Select service</option>
                  {tariffs.map((tariff) => (
                    <option key={tariff._id} value={tariff._id}>
                      {tariff.serviceName} — ₦{formatPrice(tariff.price)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-gray-600">
                Body part
                <input
                  required
                  value={newOrder.bodyPart}
                  onChange={(event) => setNewOrder((current) => ({ ...current, bodyPart: event.target.value }))}
                  placeholder="e.g. Chest"
                  className="mt-1 min-h-11 w-full rounded-lg border p-2 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-gray-600 sm:col-span-2 lg:col-span-3">
                Clinical notes (optional)
                <textarea
                  rows="2"
                  value={newOrder.clinicalNotes}
                  onChange={(event) => setNewOrder((current) => ({ ...current, clinicalNotes: event.target.value }))}
                  className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={creating || loading || patients.length === 0 || tariffs.length === 0}
              className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating order...' : 'Create order'}
            </button>
            {!loading && patients.length === 0 && (
              <p className="text-sm text-amber-700">Register a patient before creating a radiology order.</p>
            )}
            {!loading && tariffs.length === 0 && (
              <p className="text-sm text-amber-700">Configure an active radiology tariff in Settings before creating orders.</p>
            )}
          </form>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex-1 text-xs font-bold text-gray-600">
              Search orders
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Patient, tracking number, imaging type, or body part"
                className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2 text-sm font-normal"
              />
            </label>
            <label className="text-xs font-bold text-gray-600 sm:w-48">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border bg-white p-2 text-sm font-normal"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading radiology orders...</p>
          ) : visibleOrders.length === 0 ? (
            <p className="rounded-lg border bg-white p-5 text-sm text-gray-500">
              {orders.length ? 'No radiology orders match these filters.' : 'No radiology orders found.'}
            </p>
          ) : (
            <div className="space-y-4">
              {visibleOrders.map((order) => {
                const patient = order.patientId;
                const completed = order.status === 'COMPLETED';

                return (
                  <article key={order._id} className="space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
                      {patient?._id ? (
                        <Link
                          to={`/patients/${encodeURIComponent(patient.patientId)}`}
                          className="min-h-11 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <span className="block font-mono text-xs font-bold text-blue-700">{patient.patientId}</span>
                          <strong className="text-sm text-gray-900">{patientName(patient)}</strong>
                          <span className="ml-2 text-xs font-semibold text-blue-700">View patient</span>
                        </Link>
                      ) : (
                        <strong className="text-sm text-gray-900">Patient unavailable</strong>
                      )}
                      <span className={`w-fit rounded px-2.5 py-1 text-xs font-bold ${
                        completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400">Imaging examination</p>
                        <p className="text-base font-bold text-blue-900">{order.scanType} — {order.bodyPart}</p>
                        <p className="mt-1 text-xs text-gray-500">Requested by: {requestedBy(order)}</p>
                        <p className="text-xs text-gray-500">Ordered: {formatDate(order.createdAt)}</p>
                        <p className="text-xs text-gray-500">Price: {formatPrice(order.price)}</p>
                      </div>
                      {order.clinicalNotes && (
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-400">Clinical notes</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{order.clinicalNotes}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`findings-${order._id}`} className="block text-xs font-bold uppercase text-gray-500">
                        Radiologist findings
                      </label>
                      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <textarea
                          id={`findings-${order._id}`}
                          rows="4"
                          value={findings[order._id] ?? order.findings ?? ''}
                          disabled={completed}
                          onChange={(event) => setFindings((current) => ({ ...current, [order._id]: event.target.value }))}
                          className="w-full rounded-lg border bg-gray-50 p-3 text-sm text-gray-800 disabled:opacity-80"
                        />
                        {!completed && (
                          <div className="flex shrink-0 flex-col gap-2 sm:w-44">
                            <button
                              type="button"
                              disabled={savingId === order._id}
                              onClick={() => void saveReport(order, false)}
                              className="min-h-11 rounded-lg border border-blue-600 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            >
                              {savingId === order._id && savingAction === 'draft' ? 'Saving...' : 'Save draft'}
                            </button>
                            <button
                              type="button"
                              disabled={savingId === order._id}
                              onClick={() => void saveReport(order, true)}
                              className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {savingId === order._id && savingAction === 'complete' ? 'Completing...' : 'Complete report'}
                            </button>
                          </div>
                        )}
                        {completed && (
                          <button
                            type="button"
                            onClick={() => openPrintView(order)}
                            className="min-h-11 shrink-0 rounded-lg border border-blue-600 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
                          >
                            Print report
                          </button>
                        )}
                      </div>
                      {completed && (
                        <p className="mt-2 text-xs text-gray-500">
                          Report completed {formatDate(order.reportCompletedAt || order.updatedAt)}
                          {order.reportedById ? ` by ${reportedBy(order)}` : ''}.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {printReport && (
        <article className="radiology-print" aria-label="Printable radiology report">
          <header style={{ borderBottom: '2px solid #111', marginBottom: 24, paddingBottom: 16 }}>
            <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>Radiology Report</h1>
            <p style={{ margin: 0 }}>Diagnostic Imaging Result</p>
          </header>
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <p><strong>Patient:</strong> {patientName(printReport.patientId)}</p>
            <p><strong>Clinic tracking number:</strong> {printReport.patientId?.patientId || '—'}</p>
            <p><strong>Date of birth:</strong> {formatDateOnly(printReport.patientId?.dateOfBirth)}</p>
            <p><strong>Sex:</strong> {printReport.patientId?.gender || '—'}</p>
            <p><strong>Examination:</strong> {printReport.scanType} — {printReport.bodyPart}</p>
            <p><strong>Order date:</strong> {formatDate(printReport.createdAt)}</p>
            <p><strong>Requested by:</strong> {requestedBy(printReport)}</p>
            <p><strong>Reported by:</strong> {reportedBy(printReport)}</p>
          </section>
          {printReport.clinicalNotes && (
            <section style={{ marginTop: 16 }}>
              <h2 style={{ fontSize: 16 }}>Clinical notes</h2>
              <p style={{ whiteSpace: 'pre-wrap' }}>{printReport.clinicalNotes}</p>
            </section>
          )}
          <section style={{ marginTop: 24 }}>
            <h2 style={{ borderBottom: '1px solid #777', fontSize: 18, paddingBottom: 8 }}>Findings / Report</h2>
            <p style={{ lineHeight: 1.6, minHeight: 120, whiteSpace: 'pre-wrap' }}>{printReport.findings}</p>
          </section>
          <footer style={{ borderTop: '1px solid #aaa', marginTop: 32, paddingTop: 12, fontSize: 10 }}>
            Completed: {formatDate(printReport.reportCompletedAt || printReport.updatedAt)}
          </footer>
        </article>
      )}
    </>
  );
};

export default Radiology;
