import InventoryItem from '../models/InventoryItem.js';

export const getInventoryItems = async (req, res) => {
  try {
    const items = await InventoryItem.find({ tenantId: req.user.tenantId }).sort({ name: 1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching inventory', error: error.message });
  }
};

export const addInventoryItem = async (req, res) => {
  try {
    const { name, category, quantity, unit, reorderLevel, unitPrice, supplier } = req.body;
    const item = await InventoryItem.create({
      tenantId: req.user.tenantId,
      name,
      category,
      quantity,
      unit,
      reorderLevel,
      unitPrice,
      supplier,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding inventory item', error: error.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { quantityChange, reason } = req.body; // quantityChange can be positive (restock) or negative (dispense)
    const change = Number(quantityChange);
    if (!Number.isFinite(change) || change === 0) {
      return res.status(400).json({ success: false, message: 'Quantity change must be a non-zero number' });
    }

    const query = { _id: req.params.id, tenantId: req.user.tenantId };
    if (change < 0) query.quantity = { $gte: Math.abs(change) };
    const item = await InventoryItem.findOneAndUpdate(
      query,
      { $inc: { quantity: change } },
      { new: true, runValidators: true },
    );

    if (!item) {
      const exists = await InventoryItem.exists({ _id: req.params.id, tenantId: req.user.tenantId });
      return res.status(exists ? 400 : 404).json({
        success: false,
        message: exists ? 'Insufficient stock for this adjustment' : 'Inventory item not found',
      });
    }
    res.status(200).json({ success: true, data: item, message: `Stock updated (${reason || 'Adjustment'})` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating stock', error: error.message });
  }
};

export const getLowStockAlerts = async (req, res) => {
  try {
    const items = await InventoryItem.find({
      tenantId: req.user.tenantId,
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    });

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching low stock alerts', error: error.message });
  }
};