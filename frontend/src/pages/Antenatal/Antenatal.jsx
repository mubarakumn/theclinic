import React, { useState } from 'react';

const Antenatal = () => {
  const [ancPatients] = useState([
    {
      id: 'ANC-001',
      name: 'Fatima Abubakar',
      cardNo: 'MED-2026-0042',
      gestationalAge: '31 Weeks',
      edd: '2026-10-22',
      gravidaPara: 'G2 P1',
      fetalHeartRate: '142 bpm',
      fundalHeight: '30 cm',
      nextVisit: '2026-09-06',
    },
    {
      id: 'ANC-002',
      name: 'Chioma Adebayo',
      cardNo: 'MED-2026-0118',
      gestationalAge: '18 Weeks',
      edd: '2027-01-14',
      gravidaPara: 'G1 P0',
      fetalHeartRate: '150 bpm',
      fundalHeight: '18 cm',
      nextVisit: '2026-09-20',
    },
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">Antenatal Care (ANC) Clinic</h1>
          <p className="text-sm text-gray-500">Maternal health tracking, gestational milestones, and prenatal schedules.</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-purple-50 border-b text-xs font-bold text-purple-900 uppercase">
            <tr>
              <th className="p-4">Card No</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Gravida / Para</th>
              <th className="p-4">Gestational Age</th>
              <th className="p-4">EDD</th>
              <th className="p-4">Fetal HR / Fundal Height</th>
              <th className="p-4">Next Appointment</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ancPatients.map((patient) => (
              <tr key={patient.id} className="hover:bg-purple-50/40 transition">
                <td className="p-4 font-mono font-bold text-purple-800">{patient.cardNo}</td>
                <td className="p-4 font-bold text-gray-900">{patient.name}</td>
                <td className="p-4 font-semibold text-gray-600">{patient.gravidaPara}</td>
                <td className="p-4">
                  <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-bold">
                    {patient.gestationalAge}
                  </span>
                </td>
                <td className="p-4 text-xs font-mono font-medium">{patient.edd}</td>
                <td className="p-4 text-xs text-gray-700">
                  {patient.fetalHeartRate} | {patient.fundalHeight}
                </td>
                <td className="p-4 font-bold text-blue-600 text-xs">{patient.nextVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Antenatal;