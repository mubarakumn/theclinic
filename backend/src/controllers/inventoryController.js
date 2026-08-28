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
    const item = await InventoryItem.create({
      ...req.body,
      tenantId: req.user.tenantId,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding inventory item', error: error.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { quantityChange, reason } = req.body; // quantityChange can be positive (restock) or negative (dispense)
    const item = await InventoryItem.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    item.quantityInStock += Number(quantityChange);
    if (item.quantityInStock < 0) item.quantityInStock = 0;

    await item.save();
    res.status(200).json({ success: true, data: item, message: `Stock updated (${reason || 'Adjustment'})` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating stock', error: error.message });
  }
};

export const getLowStockAlerts = async (req, res) => {
  try {
    const items = await InventoryItem.find({
      tenantId: req.user.tenantId,
      $expr: { $lte: ['$quantityInStock', '$reorderLevel'] },
    });

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching low stock alerts', error: error.message });
  }
};