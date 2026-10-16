import { useCallback, useEffect, useState } from 'react';
import API from '../../api';

const Pharmacy = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispensingId, setDispensingId] = useState('');
  const [error, setError] = useState('');

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get('/prescriptions');
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const dispensePrescription = async (prescription) => {
    try {
      setDispensingId(prescription._id);
      setError('');
      const { data } = await API.post(`/prescriptions/${prescription._id}/dispense`);
      setPrescriptions((current) => current.map((item) =>
        item._id === prescription._id ? data.prescription : item
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispense prescription.');
    } finally {
      setDispensingId('');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pharmacy & Dispensing Desk</h1>
        <p className="text-sm text-gray-500">Review prescriptions and update their recorded dispensing status.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b bg-green-50 text-xs font-bold uppercase text-green-900">
            <tr>
              <th className="p-4">MRN</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Medication & Dosage</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">Loading prescriptions...</td></tr>
            ) : prescriptions.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No prescriptions found.</td></tr>
            ) : prescriptions.map((prescription) => {
              const patient = prescription.patientId;
              const patientName = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
              const status = prescription.status;
              const isPrescribed = status === 'PRESCRIBED';

              return (
                <tr key={prescription._id} className="hover:bg-gray-50">
                  <td className="p-4 font-mono font-bold text-blue-700">
                    {patient?.mrn || patient?.patientId || '—'}
                  </td>
                  <td className="p-4 font-bold text-gray-900">{patientName || 'Patient unavailable'}</td>
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{prescription.medicationName}</p>
                    <p className="text-xs text-gray-500">{prescription.dosage}</p>
                  </td>
                  <td className="p-4 font-bold">{prescription.quantity}</td>
                  <td className="p-4">
                    <span className={`rounded px-2.5 py-1 text-xs font-bold ${
                      status === 'DISPENSED' ? 'bg-green-100 text-green-800' :
                        status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {isPrescribed && (
                      <button
                        type="button"
                        disabled={dispensingId === prescription._id}
                        onClick={() => dispensePrescription(prescription)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {dispensingId === prescription._id ? 'Saving...' : 'Dispense'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pharmacy;
