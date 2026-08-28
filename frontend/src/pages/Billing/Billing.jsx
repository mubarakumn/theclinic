import React, { useState } from 'react';

const Billing = () => {
  const [selectedPatient, setSelectedPatient] = useState({
    cardNo: 'MED-2026-0042',
    name: 'Fatima Abubakar',
    visitType: 'ANC Checkup',
  });

  const [pendingItems, setPendingItems] = useState([
    { id: 'ITEM-1', department: 'Consultation', description: 'ANC Specialist Consultation Fee', amount: 5000, selected: true },
    { id: 'ITEM-2', font: 'Lab', department: 'Laboratory', description: 'Urinalysis Test', amount: 2500, selected: true },
    { id: 'ITEM-3', department: 'Pharmacy', description: 'Prenatal Vitamins (30 Tabs)', amount: 4500, selected: true },
    { id: 'ITEM-4', department: 'Admissions', description: 'Bed Charge - Female Ward (1 Night)', amount: 8000, selected: false },
  ]);

  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('POS');
  const [isPaid, setIsPaid] = useState(false);

  const toggleItemSelection = (id) => {
    setPendingItems(
      pendingItems.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const subtotal = pendingItems
    .filter((i) => i.selected)
    .reduce((acc, item) => acc + item.amount, 0);

  const totalPayable = Math.max(0, subtotal - Number(discount));

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (totalPayable <= 0 && subtotal > 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }
    setIsPaid(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cashier Terminal & Auto-Billing</h1>
          <p className="text-sm text-gray-500">Aggregate pending clinical charges, process payments, and issue receipts.</p>
        </div>
        {isPaid && (
          <button
            onClick={handlePrintReceipt}
            className="bg-gray-800 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-black transition shadow"
          >
            🖨️ Print Receipt
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Items Aggregation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 uppercase">{selectedPatient.cardNo}</span>
                <h2 className="text-lg font-bold text-gray-900">{selectedPatient.name}</h2>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                {selectedPatient.visitType}
              </span>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unbilled Pending Charges</p>

            <div className="divide-y border rounded-lg overflow-hidden">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !isPaid && toggleItemSelection(item.id)}
                  className={`p-3.5 flex justify-between items-center cursor-pointer transition ${
                    item.selected ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      disabled={isPaid}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{item.description}</p>
                      <span className="text-[10px] uppercase font-bold text-gray-400">{item.department}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm text-gray-900">
                    ₦{item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary */}
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900 border-b pb-2">Payment Summary</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-gray-900">₦{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Discount (₦)</span>
                <input
                  type="number"
                  disabled={isPaid}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 border rounded p-1 text-right font-mono text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="border-t pt-2 flex justify-between items-center font-bold text-base text-gray-900">
                <span>Total Payable</span>
                <span className="font-mono text-lg text-blue-600">₦{totalPayable.toLocaleString()}</span>
              </div>
            </div>

            {!isPaid ? (
              <form onSubmit={handleProcessPayment} className="space-y-4 pt-2 border-t">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm font-semibold text-gray-800 outline-none"
                  >
                    <option value="POS">POS Terminal</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={subtotal === 0}
                  className="w-full bg-green-600 text-white font-bold text-sm py-3 rounded-xl shadow-lg hover:bg-green-700 disabled:opacity-50 transition"
                >
                  Confirm & Post Payment
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center space-y-1">
                <p className="font-bold text-sm">✓ Payment Successful</p>
                <p className="text-xs">Mode: {paymentMode}</p>
                <p className="text-[10px] font-mono text-green-600">TXN-REF: {Math.floor(100000 + Math.random() * 900000)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;