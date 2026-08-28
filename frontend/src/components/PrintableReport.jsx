import React from 'react';

const PrintableReport = ({ title, patientName, date, children }) => {
  return (
    <div className="print-container">
      <div className="flex justify-between border-b pb-4 mb-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm">Patient: {patientName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm">Date: {date}</p>
        </div>
      </div>
      
      <div className="report-body">
        {children}
      </div>

      <div className="no-print mt-6 flex justify-end">
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
};

export default PrintableReport;