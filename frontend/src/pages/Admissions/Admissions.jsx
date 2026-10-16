import { useCallback, useEffect, useState } from 'react';
import API from '../../api';

const Admissions = () => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [releasingId, setReleasingId] = useState('');

  const fetchBeds = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get('/beds', { params: { limit: 100 } });
      setBeds(data.beds || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bed occupancy.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const releaseBed = async (bed) => {
    try {
      setReleasingId(bed._id);
      setError('');
      const { data } = await API.post(`/beds/${bed._id}/release`);
      setBeds((current) => current.map((item) => item._id === bed._id ? data.bed : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release bed.');
    } finally {
      setReleasingId('');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inpatient Admissions & Ward Management</h1>
        <p className="text-sm text-gray-500">Current ward occupancy, bed allocation, and bed release.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading beds...</p>
      ) : beds.length === 0 ? (
        <p className="rounded-lg border bg-white p-5 text-sm text-gray-500">No beds have been configured.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {beds.map((bed) => {
            const patient = bed.currentPatient;
            const patientName = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');

            return (
              <div key={bed._id} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <strong className="text-sm text-gray-900">{bed.wardName}</strong>
                    <p className="font-mono text-xs text-gray-500">{bed.bedNumber}</p>
                  </div>
                  <span className={`rounded px-2.5 py-1 text-xs font-bold ${
                    bed.isOccupied ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {bed.isOccupied ? 'Occupied' : 'Available'}
                  </span>
                </div>

                {bed.isOccupied && (
                  <>
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">Current patient</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-800">
                        {patientName || 'Patient information unavailable'}
                      </p>
                      {patient?.patientId && <p className="font-mono text-xs text-gray-500">{patient.patientId}</p>}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={releasingId === bed._id}
                        onClick={() => releaseBed(bed)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {releasingId === bed._id ? 'Releasing...' : 'Release bed'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Admissions;
