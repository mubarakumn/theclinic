import React, { useState } from 'react';

const Radiology = () => {
  const [scans] = useState([
    {
      id: 'RAD-501',
      patientName: 'Fatima Abubakar',
      cardNo: 'MED-2026-0042',
      scanType: 'Obstetric Ultrasound (USS)',
      requestedBy: 'Dr. Sarah Aliyu',
      status: 'Completed',
      impression: 'Single live intrauterine fetus at 31 weeks. Good cardiac activity.',
    },
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Radiology & Diagnostic Imaging</h1>
        <p className="text-sm text-gray-500">Ultrasound (USS), X-ray, and CT scan reporting workstation.</p>
      </div>

      <div className="space-y-4">
        {scans.map((scan) => (
          <div key={scan.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="font-mono font-bold text-blue-700 text-xs mr-2">{scan.cardNo}</span>
                <strong className="text-gray-900 text-sm">{scan.patientName}</strong>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded font-bold">
                {scan.status}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Imaging Type</p>
              <p className="text-base font-bold text-blue-900">{scan.scanType}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Radiologist Impression</p>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border mt-1">{scan.impression}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Radiology;