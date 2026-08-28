import React, { useState } from 'react';

const ServicesPriceList = () => {
  const [services, setServices] = useState([
    { id: 'SVC-01', department: 'Registration', name: 'New Patient Card Creation', code: 'REG-001', price: 2000 },
    { id: 'SVC-02', department: 'Consultation', name: 'General Practitioner Consultation', code: 'CNS-001', price: 3500 },
    { id: 'SVC-03', department: 'Consultation', name: 'Specialist / ANC Consultation', code: 'CNS-002', price: 5000 },
    { id: 'SVC-04', department: 'Laboratory', name: 'Urinalysis Test', code: 'LAB-012', price: 2500 },
    { id: 'SVC-05', department: 'Laboratory', name: 'Full Blood Count (FBC)', code: 'LAB-045', price: 4000 },
    { id: 'SVC-06', department: 'Radiology', name: 'Obstetric Ultrasound (USS)', code: 'RAD-008', price: 6500 },
    { id: 'SVC-07', department: 'Admissions', name: 'General Ward Bed Space (Per Night)', code: 'ADM-001', price: 8000 },
  ]);

  const [newService, setNewService] = useState({ department: 'Consultation', name: '', code: '', price: '' });
  const [editingId, setEditingId] = useState(null);

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;
    
    setServices([
      ...services,
      {
        id: `SVC-0${services.length + 1}`,
        ...newService,
        price: Number(newService.price),
      },
    ]);
    setNewService({ department: 'Consultation', name: '', code: '', price: '' });
  };

  const handlePriceChange = (id, newPrice) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, price: Number(newPrice) } : s))
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Services & Baseline Tariff Master</h1>
        <p className="text-sm text-gray-500">Configure baseline prices for hospital tariffs, consultations, labs, and bed fees.</p>
      </div>

      {/* Add New Service Form */}
      <form onSubmit={handleAddService} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wide">Add New Tariff Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Department</label>
            <select
              value={newService.department}
              onChange={(e) => setNewService({ ...newService, department: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm outline-none"
            >
              <option value="Registration">Registration</option>
              <option value="Consultation">Consultation</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Radiology">Radiology</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Admissions">Admissions</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Service Name</label>
            <input
              type="text"
              placeholder="e.g. Chest X-Ray"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Service Code</label>
            <input
              type="text"
              placeholder="e.g. RAD-010"
              value={newService.code}
              onChange={(e) => setNewService({ ...newService, code: e.target.value })}
              className="w-full border rounded-lg p-2 text-sm outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Price (₦)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="5000"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm outline-none font-mono"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Services Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
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
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono font-bold text-xs text-blue-600">{s.code || s.id}</td>
                <td className="p-4">
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-bold">
                    {s.department}
                  </span>
                </td>
                <td className="p-4 font-semibold text-gray-800">{s.name}</td>
                <td className="p-4 text-right">
                  <input
                    type="number"
                    value={s.price}
                    onChange={(e) => handlePriceChange(s.id, e.target.value)}
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