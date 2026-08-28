import Tenant from '../models/Tenant.js';
import ServicePrice from '../models/ServicePrice.js';

// Get clinic settings & profile
export const getClinicSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Clinic settings not found' });

    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching clinic settings', error: error.message });
  }
};

// Update clinic settings
export const updateClinicSettings = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(req.tenantId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating clinic settings', error: error.message });
  }
};

// Fetch service price tariff list
export const getServicePrices = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { tenantId: req.tenantId };
    if (category) query.category = category;

    const prices = await ServicePrice.find(query).sort({ category: 1, serviceName: 1 });
    res.status(200).json({ success: true, count: prices.length, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching service prices', error: error.message });
  }
};

// Create a new service price entry
export const createServicePrice = async (req, res) => {
  try {
    const { category, serviceName, serviceCode, price, description } = req.body;

    const servicePrice = await ServicePrice.create({
      tenantId: req.tenantId,
      category,
      serviceName,
      serviceCode,
      price,
      description,
    });

    res.status(201).json({ success: true, data: servicePrice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating service price', error: error.message });
  }
};

// Update an existing service price
export const updateServicePrice = async (req, res) => {
  try {
    const servicePrice = await ServicePrice.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!servicePrice) return res.status(404).json({ success: false, message: 'Service price item not found' });
    res.status(200).json({ success: true, data: servicePrice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating service price', error: error.message });
  }
};

// Delete a service price item
export const deleteServicePrice = async (req, res) => {
  try {
    const servicePrice = await ServicePrice.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!servicePrice) return res.status(404).json({ success: false, message: 'Service price item not found' });

    res.status(200).json({ success: true, message: 'Service price removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting service price', error: error.message });
  }
};