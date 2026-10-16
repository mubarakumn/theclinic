import { useCallback, useEffect, useState } from 'react';
import API from '../../api';

const categories = [
  ['CONSULTATION', 'Consultation'],
  ['LABORATORY', 'Laboratory'],
  ['RADIOLOGY', 'Radiology'],
  ['BED_NIGHT', 'Admissions'],
  ['SURGERY', 'Surgery'],
  ['NURSING_CARE', 'Nursing care'],
  ['OTHER', 'Other'],
];

const initialService = { category: 'CONSULTATION', serviceName: '', serviceCode: '', price: '' };

const ServicesPriceList = () => {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState(initialService);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get('/settings/tariffs');
      setServices(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load service tariffs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAddService = async (event) => {
    event.preventDefault();
    if (!newService.serviceName.trim() || newService.price === '') {
      setError('Service name and price are required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      const { data } = await API.post('/settings/tariffs', {
        ...newService,
        price: Number(newService.price),
      });
      setServices((current) => [...current, data.data].sort((a, b) =>
        a.category.localeCompare(b.category) || a.serviceName.localeCompare(b.serviceName)
      ));
      setNewService(initialService);
      setMessage('Tariff added.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add tariff.');
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = async (service, value) => {
    const price = Number(value);
    if (value === '' || !Number.isFinite(price) || price < 0 || price === service.price) return;

    try {
      setError('');
      setMessage('');
      const { data } = await API.put(`/settings/tariffs/${service._id}`, { price });
      setServices((current) => current.map((item) => item._id === service._id ? data.data : item));
      setMessage(`${service.serviceName} tariff updated.`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update ${service.serviceName}.`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Services & Baseline Tariff Master</h1>
        <p className="text-sm text-gray-500">Configure baseline prices for hospital tariffs, consultations, labs, and bed fees.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}

      <form onSubmit={handleAddService} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wide">Add New Tariff Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-[10px] font-bold text-gray-500 uppercase">
            Department
            <select
              value={newService.category}
              onChange={(e) => setNewService({ ...newService, category: e.target.value })}
              className="mt-1 w-full border rounded-lg p-2 text-sm font-normal normal-case text-gray-800"
            >
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold text-gray-500 uppercase">
            Service Name
            <input
              required
              value={newService.serviceName}
              onChange={(e) => setNewService({ ...newService, serviceName: e.target.value })}
              className="mt-1 w-full border rounded-lg p-2 text-sm font-normal normal-case"
            />
          </label>
          <label className="text-[10px] font-bold text-gray-500 uppercase">
            Service Code
            <input
              value={newService.serviceCode}
              onChange={(e) => setNewService({ ...newService, serviceCode: e.target.value })}
              className="mt-1 w-full border rounded-lg p-2 text-sm font-mono font-normal normal-case"
            />
          </label>
          <div className="flex items-end gap-2">
            <label className="flex-1 text-[10px] font-bold text-gray-500 uppercase">
              Price (₦)
              <input
                required
                min="0"
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                className="mt-1 w-full border rounded-lg p-2 text-sm font-mono font-normal normal-case"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap disabled:opacity-50"
            >
              {saving ? 'Adding...' : '+ Add'}
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-xs font-bold text-gray-600 uppercase">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Department</th>
              <th className="p-4">Service Description</th>
              <th className="p-4 text-right">Baseline Tariff (₦)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">Loading tariffs...</td></tr>
            ) : services.length === 0 ? (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">No tariffs configured.</td></tr>
            ) : services.map((service) => (
              <tr key={service._id} className="hover:bg-gray-50">
                <td className="p-4 font-mono font-bold text-xs text-blue-600">{service.serviceCode || '—'}</td>
                <td className="p-4">
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-bold">
                    {categories.find(([value]) => value === service.category)?.[1] || service.category}
                  </span>
                </td>
                <td className="p-4 font-semibold text-gray-800">{service.serviceName}</td>
                <td className="p-4 text-right">
                  <input
                    type="number"
                    min="0"
                    defaultValue={service.price}
                    key={`${service._id}-${service.price}`}
                    onBlur={(e) => handlePriceChange(service, e.target.value)}
                    className="w-28 border rounded p-1 text-right font-mono font-bold text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServicesPriceList;
