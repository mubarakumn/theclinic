import React, { useState } from 'react';

const MedicalRecords = () => {
  const [activeEncounter, setActiveEncounter] = useState({
    encounterId: 'ENC-889',
    patientId: 'P-10024',
    patientName: 'Fatima Abubakar',
    cardNo: 'MED-2026-0042',
    gender: 'Female',
    age: 28,
    visitType: 'ANC Checkup',
  });

  const [vitals, setVitals] = useState({
    bp: '120/80',
    pulse: '74',
    temp: '36.6',
    weight: '68',
    height: '165',
    spo2: '98',
  });

  const [notes, setNotes] = useState({
    chiefComplaint: 'Routine ANC checkup, mild lower back pain.',
    clinicalFindings: 'Uterus corresponds to 31 weeks. Fetal heart rate regular.',
    diagnosis: 'Normal Singleton Pregnancy (31 Weeks)',
  });

  const [labOrders, setLabOrders] = useState([]);
  const [newLab, setNewLab] = useState('');

  const [prescriptions, setPrescriptions] = useState([]);
  const [newDrug, setNewDrug] = useState({ name: '', dosage: '1 Tab Daily', qty: 30 });

  const handleAddLab = () => {
    if (!newLab.trim()) return;
    setLabOrders([...labOrders, { id: Date.now(), testName: newLab, status: 'Pending' }]);
    setNewLab('');
  };

  const handleAddDrug = () => {
    if (!newDrug.name.trim()) return;
    setPrescriptions([...prescriptions, { id: Date.now(), ...newDrug, status: 'Prescribed' }]);
    setNewDrug({ name: '', dosage: '1 Tab Daily', qty: 30 });
  };

  const handleSaveConsultation = (e) => {
    e.preventDefault();
    alert(`Consultation and order pipeline recorded for Encounter ${activeEncounter.encounterId}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Active Encounter Banner */}
      <div className="bg-blue-600 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-800 text-blue-100 text-xs px-2.5 py-0.5 rounded font-bold uppercase">
              {activeEncounter.visitType}
            </span>
            <h1 className="text-xl font-bold">{activeEncounter.patientName}</h1>
          </div>
          <p className="text-xs text-blue-100 mt-1">
            MRN: <span className="font-mono font-bold">{activeEncounter.cardNo}</span> | Gender: {activeEncounter.gender} | Age: {activeEncounter.age} Yrs
          </p>
        </div>
        <div className="bg-blue-700 px-4 py-2 rounded-lg text-right text-xs">
          <p className="text-blue-200">Encounter ID</p>
          <p className="font-mono font-bold text-sm">{activeEncounter.encounterId}</p>
        </div>
      </div>

      <form onSubmit={handleSaveConsultation} className="space-y-6">
        {/* Vitals Recording */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-gray-800 border-b pb-2">1. Vitals & Biometrics Triage</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Blood Pressure</label>
              <input
                type="text"
                placeholder="120/80"
                value={vitals.bp}
                onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm text-center font-bold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pulse (bpm)</label>
              <input
                type="number"
                placeholder="72"
                value={vitals.pulse}
                onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm text-center font-bold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Temp (°C)</label>
              <input
                type="text"
                placeholder="36.5"
                value={vitals.temp}
                onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm text-center font-bold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
              <input
                type="text"
                placeholder="70"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm text-center font-bold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Height (cm)</label>
              <input
                type="text"
                placeholder="165"
                value={vitals.height}
                onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm text-center font-bold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SpO2 (%)</label>
              <input
                type="number"
                placeholder="98"
                value={vitals.spo2}
                onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm text-center font-bold text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Clinical Documentation */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-gray-800 border-b pb-2">2. Consultation Notes & Diagnosis</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Chief Complaints</label>
              <textarea
                rows="2"
                value={notes.chiefComplaint}
                onChange={(e) => setNotes({ ...notes, chiefComplaint: e.target.value })}
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Clinical Findings & Physical Examination</label>
              <textarea
                rows="2"
                value={notes.clinicalFindings}
                onChange={(e) => setNotes({ ...notes, clinicalFindings: e.target.value })}
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Provisional / Working Diagnosis</label>
              <input
                type="text"
                value={notes.diagnosis}
                onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })}
                className="w-full border rounded-lg p-2.5 text-sm font-semibold text-blue-900 bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Order Pipelines (Lab & Pharmacy) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Laboratory Orders */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-800 border-b pb-2">3. Laboratory Orders</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Urinalysis, FBC, MP..."
                value={newLab}
                onChange={(e) => setNewLab(e.target.value)}
                className="flex-1 border rounded-lg p-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={handleAddLab}
                className="bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                + Order Test
              </button>
            </div>
            <ul className="divide-y text-sm">
              {labOrders.map((lab) => (
                <li key={lab.id} className="py-2 flex justify-between items-center">
                  <span className="font-semibold text-gray-800">{lab.testName}</span>
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-bold">
                    {lab.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pharmacy Orders */}
          <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-800 border-b pb-2">4. Drug Prescriptions</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Medication Name"
                value={newDrug.name}
                onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Dosage (e.g. 1 Tab Daily)"
                  value={newDrug.dosage}
                  onChange={(e) => setNewDrug({ ...newDrug, dosage: e.target.value })}
                  className="flex-1 border rounded-lg p-2 text-sm outline-none"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newDrug.qty}
                  onChange={(e) => setNewDrug({ ...newDrug, qty: e.target.value })}
                  className="w-20 border rounded-lg p-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDrug}
                  className="bg-green-600 text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-green-700"
                >
                  + Add
                </button>
              </div>
            </div>
            <ul className="divide-y text-sm">
              {prescriptions.map((drug) => (
                <li key={drug.id} className="py-2 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{drug.name}</p>
                    <p className="text-xs text-gray-500">{drug.dosage} (Qty: {drug.qty})</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-bold">
                    {drug.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition"
          >
            Save Encounter Records & Dispatch Orders
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicalRecords;