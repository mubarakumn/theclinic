import React, { createContext, useContext, useState } from 'react';
import API from '../api';

const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPatients = async (query = '') => {
    setLoading(true);
    try {
      const data = await API.get(`/patients?search=${encodeURIComponent(query)}`);
      setPatients(data.patients || data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientById = async (id) => {
    setLoading(true);
    try {
      const data = await API.get(`/patients/${id}`);
      setSelectedPatient(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const createPatient = async (patientPayload) => {
    setLoading(true);
    try {
      const data = await API.post('/patients', patientPayload);
      setPatients((prev) => [data, ...prev]);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        selectedPatient,
        loading,
        fetchPatients,
        fetchPatientById,
        createPatient,
        setSelectedPatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => useContext(PatientContext);