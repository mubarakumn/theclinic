import React, { useState } from 'react';

const Pharmacy = () => {
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'RX-881',
      patientName: 'Fatima Abubakar',
      cardNo: 'MED-2026-0042',
      drug: 'Prenatal Vitamins',
      dosage: '1 Tab Daily',
      qty: 30,
      status: 'Prescribed',
    },
    {
      id: 'RX-882',
      patientName: 'Emeka Okonkwo',
      cardNo: 'MED-2026-0089',
      drug: 'Amoxicillin 500mg',
      dosage: '1 Capsule 8-hourly',
      qty: 21,
      status: 'Dispensed',
    },
  ]);

  const handleDispense = (id) => {
    setPrescriptions(
      prescriptions.map((p) => (p.id === id ? { ...p, status: 'Dispensed' } : p))
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pharmacy & Dispensing Desk</h1>
        <p className="text-sm text-gray-500">Prescription fulfillment and real-time drug stock management.</p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-green-50 border-b text-xs font-bold text-green-900 uppercase">
            <tr>
              <th className="p-4">Card No</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Medication & Dosage</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {prescriptions.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono font-bold text-blue-700">{p.cardNo}</td>
                <td className="p-4 font-bold text-gray-900">{p.patientName}</td>
                <td className="p-4">
                  <p className="font-bold text-gray-800">{p.drug}</p>
                  <p className="text-xs text-gray-500">{p.dosage}</p>
                </td>
                <td className="p-4 font-bold">{p.qty}</td>
                <td className="p-4">
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-bold ${
                      p.status === 'Dispensed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {p.status === 'Prescribed' && (
                    <button
                      onClick={() => handleDispense(p.id)}
                      className="bg-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 shadow-sm"
                    >
                      Dispense Drug
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pharmacy;