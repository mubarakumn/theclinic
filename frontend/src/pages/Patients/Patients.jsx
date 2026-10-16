﻿import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import NewEncounterModal from './NewEncounterModal';
import { useAuth } from '../../contexts/AuthContext';

const Patients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedPatientForCheckIn, setSelectedPatientForCheckIn] = useState(null);
  const searchTermRef = useRef('');
  const canCreateEncounter = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE']
    .includes(user?.role?.toUpperCase());

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/patients';
      const params = new URLSearchParams();
      if (searchTermRef.current) params.append('search', searchTermRef.current);
      if (typeFilter !== 'All') params.append('status', typeFilter);
      
      const { data } = await API.get(`${url}?${params.toString()}`);
      if (data?.success) {
        setPatients(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError(err.response?.data?.message || 'Could not load patients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchPatients();
    }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchPatients]);

  const handleSearchTermChange = (value) => {
    searchTermRef.current = value;
    setSearchTerm(value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleOpenCheckIn = (e, patient) => {
    e.stopPropagation();
    setSelectedPatientForCheckIn(patient);
  };

  const handleCreateEncounter = async (encounterData) => {
    try {
      await API.post('/medical-records/encounter', {
        patientId: encounterData.patientId,
        chiefComplaint: encounterData.chiefComplaint,
      });
      fetchPatients();
    } catch (err) {
      console.error('Failed to create encounter', err);
      throw new Error(
        err.response?.data?.message || 'Failed to create encounter.',
        { cause: err },
      );
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Patient Directory</h1>
          <p className="text-xs md:text-sm text-gray-500">Search patients, copy physical card numbers, or open visit encounters.</p>
        </div>
        {['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST', 'ACCOUNTANT']
          .includes(user?.role?.toUpperCase()) && <button
          onClick={() => navigate('/patients/new')}
          className="min-h-11 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition"
        >
          + Register New Patient
        </button>}
      </div>

      {/* Filter & Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search by name, tracking number, physical card number, or phone..."
            value={searchTerm}
            onChange={(e) => handleSearchTermChange(e.target.value)}
            aria-label="Search patients by name, medical record number, or phone"
            className="min-h-11 w-full pl-10 pr-4 py-2 border rounded-lg text-base md:text-sm outline-none focus:ring-2 focus:ring-slate-900"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['All', 'REGISTERED', 'TRIAGE', 'DOCTOR_QUEUE', 'ADMITTED'].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setTypeFilter(category)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border whitespace-nowrap transition ${
                typeFilter === category
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button type="button" onClick={fetchPatients} className="min-h-11 self-start rounded-lg border border-red-300 px-4 font-semibold hover:bg-red-100">
            Try again
          </button>
        </div>
      )}

      <div className="divide-y overflow-hidden rounded-xl border bg-white shadow-sm md:hidden">
        {loading && <p className="p-6 text-center text-sm text-gray-500">Loading patient records…</p>}
        {!loading && patients.map((patient) => (
          <article key={patient._id} className="space-y-3 p-4">
            <button
              type="button"
              onClick={() => navigate(`/patients/${encodeURIComponent(patient.patientId)}`)}
              className="block min-h-11 w-full text-left"
            >
              <span className="block font-mono text-xs font-bold text-slate-700">Tracking no.: {patient.patientId}</span>
              <span className="mt-1 block font-semibold text-gray-900">{patient.firstName} {patient.lastName}</span>
              <span className="mt-1 block text-sm text-gray-600">{patient.phone || 'No phone number'}</span>
              {patient.physicalCardNumber && (
                <span className="mt-1 block text-xs text-gray-500">Physical card: {patient.physicalCardNumber}</span>
              )}
            </button>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {patient.status || 'REGISTERED'}
              </span>
              {canCreateEncounter && (
                <button
                  type="button"
                  onClick={() => setSelectedPatientForCheckIn(patient)}
                  className="min-h-11 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  + Check in
                </button>
              )}
            </div>
          </article>
        ))}
        {!loading && patients.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">No matching patient records found.</p>
        )}
      </div>

      {/* Patients Table */}
      <div className="hidden overflow-x-auto rounded-xl border bg-white shadow-sm md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="p-4">Clinic Tracking No.</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Registered Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!loading && patients.map((patient) => (
              <tr
                key={patient._id}
                onClick={() => navigate(`/patients/${encodeURIComponent(patient.patientId)}`)}
                className="hover:bg-slate-50 cursor-pointer transition"
              >
                <td className="p-4">
                  <p className="font-mono font-bold text-slate-900">{patient.patientId}</p>
                  {patient.physicalCardNumber && (
                    <p className="mt-1 text-xs text-gray-500">Physical card: {patient.physicalCardNumber}</p>
                  )}
                </td>
                <td className="p-4">
                  <p className="font-bold text-gray-900">{patient.firstName} {patient.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">{patient.gender}</p>
                </td>
                <td className="p-4 text-gray-600 font-mono text-xs">{patient.phone}</td>
                <td className="p-4 text-xs text-gray-500">
                  {new Date(patient.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="p-4">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-800">
                    {patient.status || 'REGISTERED'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {canCreateEncounter && <button
                    onClick={(e) => handleOpenCheckIn(e, patient)}
                    className="min-h-11 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                  >
                    + Check-In Visit
                  </button>}
                </td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan="6" className="p-8 text-center text-gray-400">Loading patient records...</td></tr>
            )}
            {!loading && patients.length === 0 && (
              <tr><td colSpan="6" className="p-8 text-center text-gray-400">No matching patient records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <NewEncounterModal
        isOpen={!!selectedPatientForCheckIn}
        onClose={() => setSelectedPatientForCheckIn(null)}
        patient={selectedPatientForCheckIn}
        onSubmit={handleCreateEncounter}
      />
    </div>
  );
};

export default Patients;