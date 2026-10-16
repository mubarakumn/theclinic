import { useCallback, useEffect, useState } from 'react';
import API from '../../api';

const departments = ['Consultation', 'Laboratory', 'Pharmacy', 'Admissions', 'Radiology', 'Registration'];
const paymentMethods = ['POS', 'Bank Transfer', 'Cash'];

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [department, setDepartment] = useState('Consultation');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('POS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [invoiceResponse, patientResponse] = await Promise.all([
        API.get('/invoices'),
        API.get('/patients'),
      ]);
      setInvoices(invoiceResponse.data.data || []);
      setPatients(patientResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const createInvoice = async (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!patientId || !description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Select a patient and enter an item description and positive amount.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      const { data } = await API.post('/invoices', {
        patientId,
        items: [{ department, description: description.trim(), amount: numericAmount }],
      });
      setInvoices((current) => [data.data, ...current]);
      setDescription('');
      setAmount('');
      setMessage('Invoice created.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSaving(false);
    }
  };

  const processPayment = async (invoice) => {
    try {
      setSaving(true);
      setError('');
      setMessage('');
      const { data } = await API.post(`/invoices/${invoice._id}/payments`, {
        paymentMethod,
      });
      setInvoices((current) => current.map((item) => item._id === invoice._id ? data.data : item));
      setMessage(`Payment recorded for ${invoice.invoiceNo}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
        <p className="text-sm text-gray-500">Create patient invoices and record payments against outstanding invoices.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}

      <form onSubmit={createInvoice} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="border-b pb-2 font-bold text-gray-900">Create Invoice</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-xs font-bold text-gray-600">
            Patient
            <select
              required
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName} — {patient.patientId || patient.mrn}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-gray-600">
            Department
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
            >
              {departments.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-gray-600">
            Charge description
            <input
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
            />
          </label>
          <div className="flex items-end gap-2">
            <label className="flex-1 text-xs font-bold text-gray-600">
              Amount (₦)
              <input
                required
                min="0.01"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
              />
            </label>
            <button
              type="submit"
              disabled={saving || patients.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </div>
        {!loading && patients.length === 0 && (
          <p className="text-xs text-gray-500">Register a patient before creating an invoice.</p>
        )}
      </form>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-gray-900">Invoices</h2>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
            Payment method
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="rounded-lg border p-2 text-sm font-normal"
            >
              {paymentMethods.map((method) => <option key={method}>{method}</option>)}
            </select>
          </label>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="rounded-lg border bg-white p-5 text-sm text-gray-500">No invoices found.</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => {
              const patient = invoice.patientId;
              const isUnpaid = invoice.status === 'UNPAID';
              return (
                <article key={invoice._id} className="flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-mono text-xs font-bold text-blue-700">{invoice.invoiceNo}</p>
                    <p className="font-bold text-gray-900">
                      {[patient?.firstName, patient?.lastName].filter(Boolean).join(' ') || 'Patient unavailable'}
                    </p>
                    <ul className="mt-1 text-sm text-gray-600">
                      {invoice.items?.map((item, index) => (
                        <li key={`${invoice._id}-${index}`}>{item.description} · {item.department}</li>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs text-gray-500">
                      {invoice.status} · {invoice.paymentMode || 'Payment pending'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <span className="font-mono text-lg font-bold text-gray-900">{formatMoney(invoice.totalAmount)}</span>
                    {isUnpaid && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => processPayment(invoice)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Billing;
