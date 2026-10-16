import { useCallback, useEffect, useState } from 'react';
import API from '../api';

const emptyItem = { name: '', category: '', quantity: '', unit: '', unitPrice: '', reorderLevel: '' };

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState(emptyItem);
  const [restockAmounts, setRestockAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get('/inventory');
      setItems(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (event) => {
    event.preventDefault();
    const item = {
      ...newItem,
      quantity: Number(newItem.quantity),
      unitPrice: Number(newItem.unitPrice),
      reorderLevel: Number(newItem.reorderLevel || 0),
    };
    if (!item.name.trim() || !Number.isFinite(item.quantity) || item.quantity < 0 ||
        !Number.isFinite(item.unitPrice) || item.unitPrice < 0 ||
        !Number.isFinite(item.reorderLevel) || item.reorderLevel < 0) {
      setError('Enter a name and valid non-negative quantities and price.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      const { data } = await API.post('/inventory', item);
      setItems((current) => [...current, data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewItem(emptyItem);
      setMessage('Inventory item added.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add inventory item.');
    } finally {
      setSaving(false);
    }
  };

  const restock = async (item) => {
    const quantityChange = Number(restockAmounts[item._id]);
    if (!Number.isFinite(quantityChange) || quantityChange <= 0) {
      setError('Enter a restock quantity greater than zero.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      const { data } = await API.patch(`/inventory/${item._id}/stock`, {
        quantityChange,
        reason: 'Restock',
      });
      setItems((current) => current.map((currentItem) =>
        currentItem._id === item._id ? data.data : currentItem
      ));
      setRestockAmounts((current) => ({ ...current, [item._id]: '' }));
      setMessage(`${item.name} stock updated.`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update stock for ${item.name}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <p className="mt-1 text-sm text-gray-600">Manage items, stock levels, and restocking from clinic inventory.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}

      <form onSubmit={addItem} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-900">Add inventory item</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ['name', 'Item name', 'text', true],
            ['category', 'Category', 'text', false],
            ['quantity', 'Opening quantity', 'number', true],
            ['unit', 'Unit', 'text', false],
            ['unitPrice', 'Unit price (₦)', 'number', true],
            ['reorderLevel', 'Reorder level', 'number', false],
          ].map(([key, label, type, required]) => (
            <label key={key} className="text-xs font-bold text-gray-600">
              {label}
              <input
                required={required}
                min={type === 'number' ? '0' : undefined}
                type={type}
                value={newItem[key]}
                onChange={(event) => setNewItem((current) => ({ ...current, [key]: event.target.value }))}
                className="mt-1 w-full rounded-lg border p-2 text-sm font-normal"
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add item'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs font-bold uppercase text-gray-600">
            <tr>
              <th className="p-4">Item</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">In stock</th>
              <th className="p-4 text-right">Reorder level</th>
              <th className="p-4 text-right">Unit price</th>
              <th className="p-4 text-right">Restock</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">Loading inventory...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No inventory items found.</td></tr>
            ) : items.map((item) => {
              const lowStock = item.quantity <= item.reorderLevel;
              return (
                <tr key={item._id}>
                  <td className="p-4 font-semibold text-gray-900">{item.name}</td>
                  <td className="p-4 text-gray-600">{item.category || '—'}</td>
                  <td className={`p-4 text-right font-bold ${lowStock ? 'text-red-700' : 'text-gray-900'}`}>
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-4 text-right text-gray-600">{item.reorderLevel}</td>
                  <td className="p-4 text-right font-mono">{`₦${Number(item.unitPrice).toLocaleString()}`}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <input
                        type="number"
                        min="1"
                        aria-label={`Restock quantity for ${item.name}`}
                        value={restockAmounts[item._id] || ''}
                        onChange={(event) => setRestockAmounts((current) => ({
                          ...current,
                          [item._id]: event.target.value,
                        }))}
                        className="w-20 rounded border p-1"
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => restock(item)}
                        className="rounded bg-slate-800 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Add stock
                      </button>
                    </div>
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

export default Inventory;
