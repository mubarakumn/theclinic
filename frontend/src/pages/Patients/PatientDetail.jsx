import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api';
import NewEncounterModal from './NewEncounterModal';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderData, setFolderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientFolder();
  }, [id]);

  const fetchPatientFolder = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/patients/${id}/folder`);
      if (data?.success) {
        setFolderData(data.data);
      }
    } catch (err) {
      console.error('Error loading patient folder:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Patient Folder...</div>;
  if (!folderData) return <div className="p-8 text-center text-red-500">Patient folder not found.</div>;

  const { patient, medicalRecords = [], labOrders = [], prescriptions = [], invoices = [] } = folderData;

  const handlePrintDocument = (printableId) => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top Header Controls */}
      <div className="flex justify-between items-center no-print">
        <button
          onClick={() => navigate('/patients')}
          className="text-xs font-bold text-gray-600 hover:text-slate-900"
        >
          ← Back to Directory
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handlePrintDocument()}
            className="border border-gray-300 bg-white text-gray-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            🖨️ Print Folder Report
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            + Check-In / New Visit
          </button>
        </div>
      </div>

      {/* Master Patient Banner */}
      <div id="printable-area" className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold">
              {patient.firstName?.[0]}{patient.lastName?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
                <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-0.5 rounded font-mono font-bold">
                  {patient.mrn || patient.cardNo}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gender: <span className="capitalize font-semibold text-gray-700">{patient.gender}</span> | 
                DOB: <span className="font-semibold text-gray-700">{new Date(patient.dateOfBirth).toLocaleDateString('en-GB')}</span> | 
                Phone: <span className="font-mono text-gray-700">{patient.phone}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Address: {patient.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b flex space-x-6 text-xs font-bold no-print">
          {[
            { id: 'timeline', label: 'Longitudinal Activity' },
            { id: 'records', label: `Consultations (${medicalRecords.length})` },
            { id: 'labs', label: `Scans & Labs (${labOrders.length})` },
            { id: 'pharmacy', label: `Prescriptions (${prescriptions.length})` },
            { id: 'billing', label: `Invoices (${invoices.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-slate-900 text-slate-900 font-extrabold'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body: Date-stamped Records */}
        <div className="pt-2">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-gray-400">Complete Historical Record</h3>
              {medicalRecords.map((rec) => (
                <div key={rec._id} className="border-l-2 border-slate-900 pl-4 py-2 space-y-1">
                  <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                    <span>Date: {new Date(rec.createdAt).toLocaleDateString('en-GB')}</span>
                    <span>Time: {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{rec.diagnosis || 'Clinical Consultation'}</p>
                  <p className="text-xs text-gray-600">{rec.notes}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'labs' && (
            <div className="space-y-3">
              {labOrders.map((lab) => (
                <div key={lab._id} className="bg-gray-50 border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">
                      Date: {new Date(lab.createdAt).toLocaleDateString('en-GB')}
                    </p>
                    <p className="text-sm font-bold text-gray-900">{lab.testName || 'Diagnostic Scan'}</p>
                    <p className="text-xs text-gray-600">Results: {lab.result || 'Pending'}</p>
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="no-print text-xs border bg-white px-2.5 py-1 rounded font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    🖨️ Print Result
                  </button>
                </div>
              ))}
              {labOrders.length === 0 && <p className="text-xs text-gray-400 py-4">No lab orders or scan reports recorded.</p>}
            </div>
          )}

          {activeTab === 'pharmacy' && (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx._id} className="bg-gray-50 border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">Date: {new Date(rx.createdAt).toLocaleDateString('en-GB')}</p>
                    <p className="text-sm font-bold text-gray-900">{rx.drugName || 'Prescribed Medication'}</p>
                    <p className="text-xs text-gray-600">Dosage: {rx.dosage || 'As Directed'}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                    {rx.status || 'Dispensed'}
                  </span>
                </div>
              ))}
              {prescriptions.length === 0 && <p className="text-xs text-gray-400 py-4">No pharmacy records found.</p>}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="p-3">Invoice Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right no-print">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="p-3 font-mono">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="p-3 font-bold">₦{(inv.total || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                          {inv.status || 'Paid'}
                        </span>
                      </td>
                      <td className="p-3 text-right no-print">
                        <button onClick={() => window.print()} className="text-slate-900 underline font-bold">
                          Print Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <NewEncounterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={patient}
        onSubmit={async () => {
          setIsModalOpen(false);
          fetchPatientFolder();
        }}
      />
    </div>
  );
};

export default PatientDetail;