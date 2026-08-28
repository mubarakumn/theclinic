import React, { useState } from 'react';

const Admissions = () => {
  const [admissions, setAdmissions] = useState([
    {
      id: 'ADM-092',
      patientName: 'Blessing Egbede',
      cardNo: 'MED-2026-0104',
      ward: 'Female Medical Ward',
      bed: 'Bed 04',
      admittedAt: '2026-08-20',
      reason: 'Observation for severe fever and dehydration.',
      status: 'Admitted',
    },
  ]);

  const handleDischarge = (id) => {
    setAdmissions(
      admissions.map((a) => (a.id === id ? { ...a, status: 'Discharged' } : a))
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inpatient Admissions & Ward Management</h1>
        <p className="text-sm text-gray-500">Active ward occupancy, bed allocation, and discharge summaries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {admissions.map((adm) => (
          <div key={adm.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="font-mono font-bold text-blue-700 text-xs mr-2">{adm.cardNo}</span>
                <strong className="text-gray-900 text-sm">{adm.patientName}</strong>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded font-bold ${
                  adm.status === 'Admitted'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {adm.status}
              </span>
            </div>

            <div className="flex justify-between text-xs bg-orange-50 p-3 rounded-lg border border-orange-100">
              <div>
                <p className="text-orange-600 font-bold">Ward Assignment</p>
                <p className="font-bold text-gray-900">{adm.ward}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-600 font-bold">Bed Space</p>
                <p className="font-mono font-bold text-gray-900">{adm.bed}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Admission Reason</p>
              <p className="text-xs text-gray-700 mt-0.5">{adm.reason}</p>
            </div>

            {adm.status === 'Admitted' && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleDischarge(adm.id)}
                  className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Process Discharge
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admissions;