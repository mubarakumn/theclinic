import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const paymentMethods = ['Cash', 'Bank Transfer', 'POS', 'Card', 'Other'];

const Billing = () => {
  const { role } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [servicePriceId, setServicePriceId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [discount, setDiscount] = useState('0');
  const [discountReason, setDiscountReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [otherMethod, setOtherMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [invoiceResponse, patientResponse, serviceResponse] = await Promise.all([
        API.get('/invoices'),
        API.get('/patients'),
        API.get('/settings/tariffs'),
      ]);
      setInvoices(invoiceResponse.data.data || []);
      setPatients(patientResponse.data.data || []);
      setServices(serviceResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchBillingData();
    }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchBillingData]);

  const createInvoice = async (event) => {
    event.preventDefault();
    const selectedService = services.find((service) => service._id === servicePriceId);
    const numericQuantity = Number(quantity);
    const numericDiscount = Number(discount);
    if (
      !patientId ||
      !selectedService ||
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 1 ||
      !Number.isFinite(numericDiscount) ||
      numericDiscount < 0 ||
      !selectedService?.isActive ||
      Number(selectedService?.price || 0) * numericQuantity <= 0 ||
      numericDiscount >= Number(selectedService?.price || 0) * numericQuantity
    ) {
      setError('Select a patient and active service, and enter a positive whole-number quantity and valid discount.');
      return;
    }
    if (numericDiscount > 0 && !discountReason.trim()) {
      setError('Enter a reason for the discount.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      const { data } = await API.post('/invoices', {
        patientId,
        items: [{ servicePriceId, quantity: numericQuantity }],
        discount: numericDiscount,
        discountReason: discountReason.trim(),
      });
      setInvoices((current) => [data.data, ...current]);
      setServicePriceId('');
      setQuantity('1');
      setDiscount('0');
      setDiscountReason('');
      setMessage('Invoice created.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSaving(false);
    }
  };

  const processPayment = async (invoice) => {
    if (paymentMethod === 'Other' && !otherMethod.trim()) {
      setError('Specify the payment method before recording payment.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      setMessage('');
      const { data } = await API.post(`/invoices/${invoice._id}/payments`, {
        paymentMethod,
        reference: paymentReference.trim(),
        otherMethod: otherMethod.trim(),
      });
      setInvoices((current) => current.map((item) => item._id === invoice._id ? data.data : item));
      setPaymentReference('');
      setOtherMethod('');
      setMessage(`Payment recorded for ${invoice.invoiceNo}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;
  const selectedService = services.find((service) => service._id === servicePriceId);
  const canApplyDiscount = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(role);
  const invoicePreview = Math.max(
    0,
    Number(selectedService?.price || 0) * Number(quantity || 0) - Number(discount || 0),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
        <p className="text-sm text-gray-500">Invoice from the clinic tariff master, apply authorized discounts, and record payment receipts.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}

      <form onSubmit={createInvoice} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="border-b pb-2 font-bold text-gray-900">Create Invoice</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                  {patient.firstName} {patient.lastName} — {patient.patientId}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-gray-600">
            Service tariff
            <select
              required
              value={servicePriceId}
              onChange={(event) => setServicePriceId(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
            >
              <option value="">Select active service</option>
              {services.filter((service) => service.isActive && Number(service.price) > 0).map((service) => (
                <option key={service._id} value={service._id}>
                  {service.serviceName} · {service.category} · {formatMoney(service.price)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-gray-600">
            Quantity
            <input
              required
              min="1"
              step="1"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
            />
          </label>
          {canApplyDiscount && (
            <>
              <label className="text-xs font-bold text-gray-600">
                Fixed discount (₦)
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
                />
              </label>
              {Number(discount) > 0 && (
                <label className="text-xs font-bold text-gray-600 md:col-span-2">
                  Discount reason
                  <input
                    required
                    value={discountReason}
                    onChange={(event) => setDiscountReason(event.target.value)}
                    className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
                  />
                </label>
              )}
            </>
          )}
          <div className="flex flex-wrap items-end justify-between gap-3 md:col-span-3">
            <p className="text-sm font-semibold text-gray-700">
              Unit price: {formatMoney(selectedService?.price)} · Total after discount: {formatMoney(invoicePreview)}
            </p>
            <button
              type="submit"
              disabled={saving || loading || patients.length === 0 || !services.some((service) => service.isActive && Number(service.price) > 0)}
              className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create invoice'}
            </button>
          </div>
        </div>
        {!loading && patients.length === 0 && (
          <p className="text-xs text-gray-500">Register a patient before creating an invoice.</p>
        )}
        {!loading && !services.some((service) => service.isActive && Number(service.price) > 0) && (
          <p className="text-xs text-amber-700">Configure active services and prices in Settings before creating invoices.</p>
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
          {paymentMethod === 'Other' && (
            <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
              Specify method
              <input
                required
                value={otherMethod}
                onChange={(event) => setOtherMethod(event.target.value)}
                placeholder="e.g. mobile wallet"
                className="rounded-lg border p-2 text-sm font-normal"
              />
            </label>
          )}
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
            Reference (optional)
            <input
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              className="rounded-lg border p-2 text-sm font-normal"
            />
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
                      {patient?._id ? (
                        <Link
                          to={`/patients/${encodeURIComponent(patient.patientId)}`}
                          className="inline-flex min-h-11 items-center text-blue-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {[patient.firstName, patient.lastName].filter(Boolean).join(' ')}
                        </Link>
                      ) : 'Patient unavailable'}
                    </p>
                    <ul className="mt-1 text-sm text-gray-600">
                      {invoice.items?.map((item, index) => (
                        <li key={`${invoice._id}-${index}`}>
                          {item.description} · {item.department} · {item.quantity || 1} × {formatMoney(item.unitPrice ?? item.amount)}
                        </li>
                      ))}
                    </ul>
                    {Number(invoice.discount) > 0 && (
                      <p className="mt-1 text-xs text-gray-600">
                        Discount: {formatMoney(invoice.discount)}{invoice.discountReason ? ` · ${invoice.discountReason}` : ''}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Subtotal {formatMoney(invoice.subtotal)} · Discount {formatMoney(invoice.discount)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {invoice.status} · {invoice.paymentMode || 'Payment pending'}
                    </p>
                    {invoice.payments?.map((payment) => (
                      <p key={payment._id} className="mt-1 text-xs text-gray-600">
                        Received {formatMoney(payment.amount)} by {payment.paymentMethod}
                        {payment.notes ? ` (${payment.notes})` : ''}
                        {payment.reference ? ` · Ref: ${payment.reference}` : ''}
                        {' · '}{new Date(payment.paidAt).toLocaleString()}
                      </p>
                    ))}
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
