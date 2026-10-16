import { useState } from 'react';

const NewEncounterModal = ({ isOpen, onClose, patient, onSubmit }) => {
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit({ patientId: patient._id, chiefComplaint: chiefComplaint.trim() });
      setChiefComplaint('');
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Could not save the encounter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base">Check-In / New Visit Encounter</h3>
            <p className="text-xs text-slate-300">
              {patient.firstName} {patient.lastName} ({patient.patientId})
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close encounter form" className="min-h-11 min-w-11 text-white hover:text-gray-300 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
          <div>
            <label htmlFor="encounter-chief-complaint" className="mb-1 block text-sm font-semibold text-gray-700">
              Reason for visit
            </label>
            <textarea
              id="encounter-chief-complaint"
              rows="3"
              placeholder="Primary symptoms or visit reason..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              required
              className="w-full rounded-lg border p-3 text-base outline-none focus:ring-2 focus:ring-slate-700"
            ></textarea>
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 rounded-lg border px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !chiefComplaint.trim()}
              className="min-h-11 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save encounter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEncounterModal;