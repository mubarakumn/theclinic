import React, { useState } from 'react';

const NewEncounterModal = ({ isOpen, onClose, patient, onSubmit }) => {
  const [formData, setFormData] = useState({
    visitType: 'General Outpatient',
    doctor: '',
    chiefComplaint: '',
    priority: 'Routine',
  });

  if (!isOpen || !patient) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      patientId: patient._id || patient.id,
      ...formData,
      checkInTime: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base">Check-In / New Visit Encounter</h3>
            <p className="text-xs text-slate-300">
              {patient.firstName} {patient.lastName} ({patient.mrn || patient.cardNo})
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Visit Type</label>
            <select
              value={formData.visitType}
              onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
              className="w-full border rounded-lg p-2.5 text-sm outline-none"
            >
              <option value="General Outpatient">General Outpatient (OPD)</option>
              <option value="Emergency Care">Emergency Care</option>
              <option value="Direct Admission">Direct Ward Admission</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Chief Complaint</label>
            <textarea
              rows="3"
              placeholder="Primary symptoms or visit reason..."
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              required
              className="w-full border rounded-lg p-2.5 text-sm outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
            >
              Confirm Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEncounterModal;