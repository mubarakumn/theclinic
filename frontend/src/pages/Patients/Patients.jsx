﻿import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import NewEncounterModal from './NewEncounterModal';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedPatientForCheckIn, setSelectedPatientForCheckIn] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, [typeFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      let url = '/patients';
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'All') params.append('status', typeFilter);
      
      const { data } = await API.get(`${url}?${params.toString()}`);
      if (data?.success) {
        setPatients(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
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
      await API.post(`/patients/${encounterData.patientId}/encounters`, encounterData);
      alert('Encounter successfully checked in!');
      fetchPatients();
    } catch (err) {
      console.error('Failed to create encounter', err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Patient Directory</h1>
          <p className="text-xs md:text-sm text-gray-500">Search patients, copy physical card numbers, or open visit encounters.</p>
        </div>
        <button
          onClick={() => navigate('/patients/new')}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition"
        >
          + Register New Patient
        </button>
      </div>

      {/* Filter & Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search by Name, MRN / Card No, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-900"
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

      {/* Patients Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
            <tr>
              <th className="p-4">Card / MRN No</th>
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
                onClick={() => navigate(`/patients/${patient.patientId}`)}
                className="hover:bg-slate-50 cursor-pointer transition"
              >
                <td className="p-4 font-mono font-bold text-slate-900">{patient.patientId || patient.cardNo}</td>
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
                  <button
                    onClick={(e) => handleOpenCheckIn(e, patient)}
                    className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                  >
                    + Check-In Visit
                  </button>
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