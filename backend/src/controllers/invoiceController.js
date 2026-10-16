import Invoice from '../models/Invoice.js';
import Patient from '../models/Patient.js';
import Tenant from '../models/Tenant.js';
import getNextSequence from '../utils/getNextSequence.js';

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ tenantId: req.user.tenantId })
      .populate({
        path: 'patientId',
        match: { tenantId: req.tenantId },
        select: 'firstName lastName patientId phone',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error('Get Invoices Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices' });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { patientId, items, discount = 0 } = req.body;
    if (!patientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one invoice item are required' });
    }

    const patient = await Patient.findOne({ _id: patientId, tenantId: req.user.tenantId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const normalizedItems = items.map((item) => ({
      department: item.department,
      description: item.description?.trim(),
      amount: Number(item.amount),
      sourceId: item.sourceId || undefined,
    }));
    if (normalizedItems.some((item) =>
      !item.description || !Number.isFinite(item.amount) || item.amount < 0
    )) {
      return res.status(400).json({ success: false, message: 'Each invoice item must have a description and non-negative amount' });
    }

    const normalizedDiscount = Number(discount);
    const subtotal = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
    if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0 || normalizedDiscount > subtotal) {
      return res.status(400).json({ success: false, message: 'Discount must be between zero and the invoice subtotal' });
    }

    const sequence = await getNextSequence(req.tenantId, 'INVOICE');
    const tenant = await Tenant.findById(req.tenantId).select('code');
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const invoiceNo = `${tenant.code}-INV-${new Date().getFullYear()}-${sequence.toString().padStart(4, '0')}`;
    const invoice = await Invoice.create({
      tenantId: req.tenantId,
      patientId,
      invoiceNo,
      items: normalizedItems,
      subtotal,
      discount: normalizedDiscount,
      totalAmount: subtotal - normalizedDiscount,
      status: 'UNPAID',
    });

    res.status(201).json({
      success: true,
      data: await invoice.populate({
        path: 'patientId',
        match: { tenantId: req.tenantId },
        select: 'firstName lastName patientId phone',
      }),
    });
  } catch (error) {
    console.error('Create Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Error creating invoice', error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
      .populate({
        path: 'patientId',
        match: { tenantId: req.tenantId },
        select: 'firstName lastName patientId email phone',
      });

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Get Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoice' });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    if (!['POS', 'Bank Transfer', 'Cash'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'A valid payment method is required' });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status !== 'UNPAID') {
      return res.status(400).json({ success: false, message: 'Only unpaid invoices can be paid' });
    }

    invoice.paymentMode = paymentMethod;
    invoice.status = 'PAID';
    invoice.cashierId = req.user._id;
    invoice.paidAt = new Date();
    await invoice.save();

    res.status(200).json({
      success: true,
      data: await invoice.populate({
        path: 'patientId',
        match: { tenantId: req.tenantId },
        select: 'firstName lastName patientId phone',
      }),
    });
  } catch (error) {
    console.error('Record Payment Error:', error);
    res.status(500).json({ success: false, message: 'Error recording payment' });
  }
};

export const generateFromOrder = async (req, res) => {
  try {
    const { patientId, orderType, items } = req.body;
    if (!patientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one invoice item are required' });
    }

    const patient = await Patient.findOne({ _id: patientId, tenantId: req.user.tenantId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const sequence = await getNextSequence(req.tenantId, 'INVOICE');
    const tenant = await Tenant.findById(req.tenantId).select('code');
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const invoiceNo = `${tenant.code}-INV-${new Date().getFullYear()}-${sequence.toString().padStart(4, '0')}`;
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const invoice = await Invoice.create({
      tenantId: req.tenantId,
      patientId,
      invoiceNo,
      items,
      subtotal,
      totalAmount: subtotal,
      status: 'UNPAID',
    });

    res.status(201).json({ success: true, data: invoice, orderType });
  } catch (error) {
    console.error('Generate Invoice From Order Error:', error);
    res.status(500).json({ success: false, message: 'Error generating order invoice' });
  }
};
