import React, { useState } from 'react';

const Laboratory = () => {
  const [orders, setOrders] = useState([
    {
      id: 'LAB-101',
      patientName: 'Fatima Abubakar',
      cardNo: 'MED-2026-0042',
      testName: 'Urinalysis',
      requestedBy: 'Dr. Sarah Aliyu',
      status: 'Pending',
      result: '',
    },
    {
      id: 'LAB-102',
      patientName: 'Emeka Okonkwo',
      cardNo: 'MED-2026-0089',
      testName: 'Full Blood Count (FBC)',
      requestedBy: 'Dr. John Danjuma',
      status: 'Pending',
      result: '',
    },
  ]);

  const handleUpdateResult = (id, resultText) => {
    setOrders(orders.map(o => o.id === id ? { ...o, result: resultText, status: resultText ? 'Completed' : 'Pending' } : o));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laboratory Workstation</h1>
        <p className="text-sm text-gray-500">Incoming physician test orders, specimen tracking, and result entry.</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="font-mono font-bold text-blue-700 text-xs mr-2">{order.cardNo}</span>
                <strong className="text-gray-900 text-sm">{order.patientName}</strong>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded font-bold ${
                order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Ordered Test</p>
                <p className="text-base font-bold text-purple-900">{order.testName}</p>
                <p className="text-xs text-gray-500 mt-0.5">Requested by: {order.requestedBy}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Enter Test Result Findings</label>
                <input
                  type="text"
                  placeholder="Type lab findings here..."
                  value={order.result}
                  onChange={(e) => handleUpdateResult(order.id, e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Laboratory;