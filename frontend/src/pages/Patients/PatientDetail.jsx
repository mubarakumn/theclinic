import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api';
import NewEncounterModal from './NewEncounterModal';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB');
};

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderData, setFolderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [physicalCardNumber, setPhysicalCardNumber] = useState('');
  const [savingPhysicalCard, setSavingPhysicalCard] = useState(false);
  const [physicalCardMessage, setPhysicalCardMessage] = useState('');

  const fetchPatientFolder = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get(`/patients/${encodeURIComponent(id)}/folder`);
      if (!data?.success || !data.data?.patient) {
        throw new Error(data?.message || 'Patient folder could not be loaded.');
      }
      setFolderData(data.data);
      setPhysicalCardNumber(data.data.patient.physicalCardNumber || '');
    } catch (err) {
      setFolderData(null);
      setError(err.response?.data?.message || err.message || 'Patient folder could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchPatientFolder();
    }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchPatientFolder]);

  const handleCreateEncounter = async ({ chiefComplaint }) => {
    await API.post('/medical-records/encounter', {
      patientId: folderData.patient._id,
      chiefComplaint,
    });
    await fetchPatientFolder();
  };

  const handlePhysicalCardSubmit = async (event) => {
    event.preventDefault();
    setSavingPhysicalCard(true);
    setPhysicalCardMessage('');
    try {
      const { data } = await API.patch(
        `/patients/${encodeURIComponent(patient.patientId)}/physical-card`,
        { physicalCardNumber },
      );
      setFolderData((current) => ({
        ...current,
        patient: { ...current.patient, physicalCardNumber: data.data.physicalCardNumber || '' },
      }));
      setPhysicalCardNumber(data.data.physicalCardNumber || '');
      setPhysicalCardMessage(data.message);
    } catch (err) {
      setPhysicalCardMessage(
        err.response?.data?.message || 'Could not update the physical card number.',
      );
    } finally {
      setSavingPhysicalCard(false);
    }
  };

  const timelineItems = useMemo(() => {
    if (!folderData) return [];
    const {
      medicalRecords = [],
      labOrders = [],
      radiologyOrders = [],
      prescriptions = [],
      invoices = [],
      antenatalRecords = [],
      admissions = [],
    } = folderData;

    return [
      ...medicalRecords.map((record) => ({
        id: `record-${record._id}`,
        type: 'Consultation',
        date: record.createdAt,
        title: record.diagnosis || record.chiefComplaint || 'Clinical consultation',
        detail: record.consultationNotes || record.treatmentPlan,
        status: record.status,
      })),
      ...labOrders.map((order) => ({
        id: `lab-${order._id}`,
        type: 'Laboratory',
        date: order.createdAt,
        title: order.testName,
        detail: order.results || 'Result pending',
        status: order.status,
      })),
      ...radiologyOrders.map((order) => ({
        id: `radiology-${order._id}`,
        type: 'Radiology',
        date: order.createdAt,
        title: [order.scanType, order.bodyPart].filter(Boolean).join(' — '),
        detail: order.findings || 'Report pending',
        status: order.status,
      })),
      ...prescriptions.map((prescription) => ({
        id: `prescription-${prescription._id}`,
        type: 'Pharmacy',
        date: prescription.createdAt,
        title: prescription.medicationName,
        detail: prescription.dosage,
        status: prescription.status,
      })),
      ...invoices.map((invoice) => ({
        id: `invoice-${invoice._id}`,
        type: 'Billing',
        date: invoice.createdAt,
        title: invoice.invoiceNo,
        detail: `₦${Number(invoice.totalAmount || 0).toLocaleString()}`,
        status: invoice.status,
      })),
      ...antenatalRecords.flatMap((record) => [
        {
          id: `antenatal-${record._id}`,
          type: 'Antenatal',
          date: record.createdAt,
          title: `Antenatal enrolment ${record.ancNumber}`,
          detail: `EDD: ${formatDate(record.edd)}`,
          status: record.status,
        },
        ...(record.visits || []).map((visit, index) => ({
          id: `antenatal-visit-${record._id}-${index}`,
          type: 'Antenatal visit',
          date: visit.date,
          title: 'Antenatal follow-up',
          detail: visit.notes,
        })),
      ]),
      ...admissions.map((bed) => ({
        id: `admission-${bed._id}`,
        type: 'Admission',
        date: bed.updatedAt,
        title: `${bed.wardName} — Bed ${bed.bedNumber}`,
        status: 'ADMITTED',
      })),
    ]
      .filter((item) => item.date)
      .sort((first, second) => new Date(second.date) - new Date(first.date));
  }, [folderData]);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading patient record…</div>;
  }

  if (error || !folderData) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-6 text-center">
        <p role="alert" className="text-sm text-red-700">{error || 'Patient not found.'}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={fetchPatientFolder}
            className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="min-h-11 rounded-lg border px-4 text-sm font-semibold text-slate-700"
          >
            Patient directory
          </button>
        </div>
      </div>
    );
  }

  const {
    patient,
    access = {},
    canManagePhysicalCard = false,
    medicalRecords = [],
    labOrders = [],
    radiologyOrders = [],
    prescriptions = [],
    invoices = [],
    antenatalRecords = [],
    admissions = [],
  } = folderData;

  const tabs = [
    { id: 'timeline', label: `Activity (${timelineItems.length})`, visible: true },
    { id: 'consultations', label: `Clinical (${medicalRecords.length})`, visible: access.clinical },
    { id: 'laboratory', label: `Lab (${labOrders.length})`, visible: access.laboratory },
    { id: 'radiology', label: `Radiology (${radiologyOrders.length})`, visible: access.radiology },
    { id: 'pharmacy', label: `Pharmacy (${prescriptions.length})`, visible: access.pharmacy },
    { id: 'billing', label: `Billing (${invoices.length})`, visible: access.billing },
    { id: 'antenatal', label: `Antenatal (${antenatalRecords.length})`, visible: access.antenatal },
    { id: 'admissions', label: `Admissions (${admissions.length})`, visible: access.admissions },
  ].filter((tab) => tab.visible);

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-3 sm:p-4 md:space-y-6 md:p-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="min-h-11 self-start text-sm font-semibold text-gray-600 hover:text-slate-900"
        >
          ← Patient directory
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Print patient record
          </button>
          {access.clinical && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + New encounter
            </button>
          )}
        </div>
      </div>

      <section id="printable-area" className="space-y-4 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3 border-b pb-4 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white sm:h-14 sm:w-14">
            {patient.firstName?.[0]}{patient.lastName?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                {patient.firstName} {patient.lastName}
              </h1>
              <span className="rounded bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800">
                {patient.patientId}
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="inline font-medium">Gender: </dt><dd className="inline capitalize">{patient.gender || '—'}</dd></div>
              <div><dt className="inline font-medium">Date of birth: </dt><dd className="inline">{formatDate(patient.dateOfBirth)}</dd></div>
              <div><dt className="inline font-medium">Phone: </dt><dd className="inline break-all">{patient.phone || '—'}</dd></div>
              <div className="sm:col-span-2 lg:col-span-3"><dt className="inline font-medium">Address: </dt><dd className="inline">{patient.address || '—'}</dd></div>
              <div><dt className="inline font-medium">Clinic tracking number: </dt><dd className="inline font-mono">{patient.patientId}</dd></div>
              <div><dt className="inline font-medium">Physical card number: </dt><dd className="inline font-mono">{patient.physicalCardNumber || 'Not linked'}</dd></div>
            </dl>
          </div>
        </div>

        {canManagePhysicalCard && (
          <form
            onSubmit={handlePhysicalCardSubmit}
            className="no-print flex flex-col gap-3 rounded-lg border bg-gray-50 p-3 sm:flex-row sm:items-end"
          >
            <label className="flex-1 text-sm font-semibold text-gray-700">
              Link existing physical card number
              <input
                type="text"
                value={physicalCardNumber}
                onChange={(event) => {
                  setPhysicalCardNumber(event.target.value);
                  setPhysicalCardMessage('');
                }}
                autoComplete="off"
                placeholder="Leave blank to unlink"
                className="mt-1 min-h-11 w-full rounded-lg border bg-white p-3 text-base font-normal focus:outline-none focus:ring-2 focus:ring-slate-700"
              />
            </label>
            <button
              type="submit"
              disabled={savingPhysicalCard}
              className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingPhysicalCard ? 'Saving…' : 'Save card link'}
            </button>
            {physicalCardMessage && (
              <p role="status" className="text-sm text-gray-700 sm:basis-full">
                {physicalCardMessage}
              </p>
            )}
          </form>
        )}

        <div
          role="tablist"
          aria-label="Patient record sections"
          className="no-print flex gap-2 overflow-x-auto border-b pb-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="min-h-40 pt-1">
          {activeTab === 'timeline' && (
            timelineItems.length === 0
              ? <p className="py-8 text-center text-sm text-gray-500">No activity is recorded for this patient yet.</p>
              : <div className="space-y-3">
                {timelineItems.map((item) => (
                  <article key={item.id} className="rounded-lg border border-l-4 border-l-slate-700 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{item.type}</span>
                      <time className="text-xs text-gray-500">{formatDate(item.date)}</time>
                    </div>
                    <h2 className="mt-1 text-sm font-semibold text-gray-900">{item.title}</h2>
                    {item.detail && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{item.detail}</p>}
                    {item.status && <p className="mt-2 text-xs font-semibold text-gray-500">{item.status.replaceAll('_', ' ')}</p>}
                  </article>
                ))}
              </div>
          )}

          {activeTab === 'consultations' && (
            medicalRecords.length === 0
              ? <p className="py-8 text-center text-sm text-gray-500">No clinical encounters recorded.</p>
              : <div className="space-y-3">
                {medicalRecords.map((record) => (
                  <article key={record._id} className="rounded-lg border p-4">
                    <p className="text-xs text-gray-500">{formatDate(record.createdAt)} · {record.status?.replaceAll('_', ' ')}</p>
                    <h2 className="mt-1 font-semibold text-gray-900">{record.diagnosis || record.chiefComplaint || 'Clinical encounter'}</h2>
                    {record.chiefComplaint && <p className="mt-2 text-sm text-gray-700"><strong>Reason:</strong> {record.chiefComplaint}</p>}
                    {record.consultationNotes && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{record.consultationNotes}</p>}
                    {record.treatmentPlan && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600"><strong>Plan:</strong> {record.treatmentPlan}</p>}
                  </article>
                ))}
              </div>
          )}

          {activeTab === 'laboratory' && (
            labOrders.length === 0
              ? <p className="py-8 text-center text-sm text-gray-500">No laboratory orders recorded.</p>
              : <div className="space-y-3">
                {labOrders.map((order) => (
                  <article key={order._id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h2 className="font-semibold text-gray-900">{order.testName}</h2>
                      <span className="text-xs font-semibold text-gray-500">{order.status?.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{order.results || 'Result pending'}</p>
                  </article>
                ))}
              </div>
          )}

          {activeTab === 'radiology' && (
            radiologyOrders.length === 0
              ? <p className="py-8 text-center text-sm text-gray-500">No radiology orders recorded.</p>
              : <div className="space-y-3">
                {radiologyOrders.map((order) => (
                  <article key={order._id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h2 className="font-semibold text-gray-900">{order.scanType} — {order.bodyPart}</h2>
                      <span className="text-xs font-semibold text-gray-500">{order.status?.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    {order.clinicalNotes && <p className="mt-2 text-sm text-gray-700"><strong>Clinical notes:</strong> {order.clinicalNotes}</p>}
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{order.findings || 'Report pending'}</p>
                  </article>
                ))}
              </div>
          )}

          {activeTab === 'pharmacy' && (
            prescriptions.length === 0
              ? <p className="py-8 text-center text-sm text-gray-500">No prescriptions recorded.</p>
              : <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <article key={prescription._id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h2 className="font-semibold text-gray-900">{prescription.medicationName}</h2>
                      <span className="text-xs font-semibold text-gray-500">{prescription.status?.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{prescription.dosage} · Quantity: {prescription.quantity}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(prescription.createdAt)}</p>
                  </article>
                ))}
              </div>
          )}

          {activeTab === 'billing' && (
            invoices.length === 0
              ? <p className="py-8 text-center text-sm text-gray-500">No billing records recorded.</p>
              : <div className="space-y-3">
                {invoices.map((invoice) => (
                  <article key={invoice._id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h2 className="font-semibold text-gray-900">{invoice.invoiceNo}</h2>
                      <span className="text-xs font-semibold text-gray-500">{invoice.status?.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{formatDate(invoice.createdAt)} · ₦{Number(invoice.totalAmount || 0).toLocaleString()}</p>
                    {invoice.paidAt && (
                      <p className="mt-1 text-sm text-gray-600">
                        Paid {formatDate(invoice.paidAt)} · {invoice.paymentMode || 'Payment recorded'}
                      </p>
                    )}
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      {(invoice.items || []).map((item, index) => (
                        <li key={`${invoice._id}-${index}`}>{item.department}: {item.description} — ₦{Number(item.amount || 0).toLocaleString()}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
          )}

          {activeTab === 'antenatal' && (
            antenatalRecords.length === 0
              ? <p className="py-8 text-center text-sm text-gray-500">No antenatal records recorded.</p>
              : <div className="space-y-3">
                {antenatalRecords.map((record) => (
                  <article key={record._id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h2 className="font-semibold text-gray-900">{record.ancNumber}</h2>
                      <span className="text-xs font-semibold text-gray-500">{record.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">LMP: {formatDate(record.lmp)} · EDD: {formatDate(record.edd)}</p>
                    <div className="mt-3 space-y-2">
                      {(record.visits || []).map((visit, index) => (
                        <div key={`${record._id}-${index}`} className="rounded bg-gray-50 p-3 text-sm">
                          <p className="font-medium text-gray-800">Visit · {formatDate(visit.date)}</p>
                          {visit.notes && <p className="mt-1 whitespace-pre-wrap text-gray-600">{visit.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
          )}

          {activeTab === 'admissions' && (
            admissions.length === 0
              ? <p className="py-8 text-center text-sm text-gray-500">No current admission for this patient.</p>
              : <div className="space-y-3">
                {admissions.map((bed) => (
                  <article key={bed._id} className="rounded-lg border p-4">
                    <h2 className="font-semibold text-gray-900">{bed.wardName} — Bed {bed.bedNumber}</h2>
                    <p className="mt-1 text-sm text-gray-600">Currently admitted · Updated {formatDate(bed.updatedAt)}</p>
                  </article>
                ))}
              </div>
          )}
        </div>
      </section>

      {access.clinical && (
        <NewEncounterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patient={patient}
          onSubmit={handleCreateEncounter}
        />
      )}
    </div>
  );
};

export default PatientDetail;
