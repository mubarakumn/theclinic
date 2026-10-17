import Invoice from '../models/Invoice.js';
import Patient from '../models/Patient.js';
import Tenant from '../models/Tenant.js';
import ServicePrice from '../models/ServicePrice.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';
import getNextSequence from '../utils/getNextSequence.js';

const departmentByCategory = {
  CONSULTATION: 'Consultation',
  LABORATORY: 'Laboratory',
  RADIOLOGY: 'Radiology',
  PHARMACY: 'Pharmacy',
  BED_NIGHT: 'Admissions',
  SURGERY: 'Surgery',
  NURSING_CARE: 'Nursing care',
  OTHER: 'Other',
};

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const resolveInvoiceItems = async (tenantId, items) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const normalizedItems = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') return null;
    const quantity = Number(item.quantity ?? 1);
    if (
      typeof item.servicePriceId !== 'string' ||
      !mongoose.Types.ObjectId.isValid(item.servicePriceId) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return null;
    }
    const service = await ServicePrice.findOne({
      _id: item.servicePriceId,
      tenantId,
      isActive: true,
    }).lean();
    if (!service) return null;
    const unitPrice = roundMoney(service.price);
    normalizedItems.push({
      servicePriceId: service._id,
      department: departmentByCategory[service.category],
      description: service.serviceName,
      quantity,
      unitPrice,
      amount: roundMoney(unitPrice * quantity),
    });
  }
  return normalizedItems;
};

const getPaymentsByInvoice = async (invoiceIds, tenantId) => {
  if (!invoiceIds.length) return new Map();
  const payments = await Payment.find({ tenantId, invoice: { $in: invoiceIds } })
    .populate({ path: 'receivedBy', match: { tenantId }, select: 'firstName lastName' })
    .sort({ paidAt: -1 })
    .lean();
  const paymentsByInvoice = new Map();
  for (const payment of payments) {
    const key = payment.invoice.toString();
    paymentsByInvoice.set(key, [...(paymentsByInvoice.get(key) || []), payment]);
  }
  return paymentsByInvoice;
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ tenantId: req.tenantId })
      .populate({
        path: 'patientId',
        match: { tenantId: req.tenantId },
        select: 'firstName lastName patientId phone',
      })
      .sort({ createdAt: -1 });
    const paymentsByInvoice = await getPaymentsByInvoice(invoices.map((invoice) => invoice._id), req.tenantId);

    res.status(200).json({
      success: true,
      data: invoices.map((invoice) => ({
        ...invoice.toObject(),
        payments: paymentsByInvoice.get(invoice._id.toString()) || [],
      })),
    });
  } catch (error) {
    console.error('Get Invoices Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices' });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { patientId, items, discount = 0, discountReason = '' } = req.body;
    if (!patientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one invoice item are required' });
    }

    const patient = await Patient.findOne({ _id: patientId, tenantId: req.tenantId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const normalizedItems = await resolveInvoiceItems(req.tenantId, items);
    if (!normalizedItems) {
      return res.status(400).json({ success: false, message: 'Every invoice line must reference an active service tariff and a positive whole-number quantity' });
    }

    const normalizedDiscount = roundMoney(Number(discount));
    const subtotal = roundMoney(normalizedItems.reduce((sum, item) => sum + item.amount, 0));
    if (subtotal <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice subtotal must be greater than zero; check the selected tariff' });
    }
    if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0 || normalizedDiscount >= subtotal) {
      return res.status(400).json({ success: false, message: 'Discount must be zero or less than the invoice subtotal' });
    }
    if (typeof discountReason !== 'string') {
      return res.status(400).json({ success: false, message: 'Discount reason must be text' });
    }
    if (normalizedDiscount > 0 && !discountReason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required when applying a discount' });
    }
    if (
      normalizedDiscount > 0 &&
      !['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: 'Only an administrator or accountant may apply an invoice discount' });
    }

    const sequence = await getNextSequence(req.tenantId, 'INVOICE');
    const tenant = await Tenant.findById(req.tenantId).select('code');
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const invoiceNo = `${tenant.code}-INV-${new Date().getFullYear()}-${sequence.toString().padStart(4, '0')}`;
    const invoice = await Invoice.create({
      tenantId: req.tenantId,
      patientId: patient._id,
      invoiceNo,
      items: normalizedItems,
      subtotal,
      discount: roundMoney(normalizedDiscount),
      discountReason: normalizedDiscount > 0 ? discountReason.trim() : '',
      totalAmount: roundMoney(subtotal - normalizedDiscount),
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
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate({
        path: 'patientId',
        match: { tenantId: req.tenantId },
        select: 'firstName lastName patientId email phone',
      });

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const paymentsByInvoice = await getPaymentsByInvoice([invoice._id], req.tenantId);
    res.status(200).json({
      success: true,
      data: {
        ...invoice.toObject(),
        payments: paymentsByInvoice.get(invoice._id.toString()) || [],
      },
    });
  } catch (error) {
    console.error('Get Invoice Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoice' });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { paymentMethod, reference = '', otherMethod = '' } = req.body;
    const paymentMethods = ['POS', 'Bank Transfer', 'Cash', 'Card', 'Other'];
    if (!paymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'A valid payment method is required' });
    }
    if (paymentMethod === 'Other' && (typeof otherMethod !== 'string' || !otherMethod.trim())) {
      return res.status(400).json({ success: false, message: 'Describe the payment method when selecting Other' });
    }
    if (typeof reference !== 'string' || typeof otherMethod !== 'string') {
      return res.status(400).json({ success: false, message: 'Payment reference and method details must be text' });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status !== 'UNPAID') {
      return res.status(400).json({ success: false, message: 'Only unpaid invoices can be paid' });
    }

    const paidAt = new Date();
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: invoice._id, tenantId: req.tenantId, status: 'UNPAID' },
      {
        $set: {
          paymentMode: paymentMethod,
          status: 'PAID',
          cashierId: req.user._id,
          paidAt,
          transactionRef: reference.trim(),
        },
      },
      { new: true },
    );
    if (!updatedInvoice) {
      return res.status(409).json({ success: false, message: 'This invoice has already been paid' });
    }

    let payment;
    try {
      [payment] = await Payment.create([{
        tenantId: req.tenantId,
        invoice: invoice._id,
        patient: invoice.patientId,
        amount: invoice.totalAmount,
        paymentMethod,
        reference: reference.trim(),
        receivedBy: req.user._id,
        paidAt,
        notes: paymentMethod === 'Other' ? otherMethod.trim() : '',
      }]);
    } catch (paymentError) {
      await Invoice.updateOne(
        { _id: invoice._id, tenantId: req.tenantId, status: 'PAID', cashierId: req.user._id, paidAt },
        { $set: { paymentMode: 'Pending', status: 'UNPAID', cashierId: null, paidAt: null, transactionRef: null } },
      );
      throw paymentError;
    }

    res.status(200).json({
      success: true,
      data: {
        ...(await updatedInvoice.populate({
        path: 'patientId',
        match: { tenantId: req.tenantId },
        select: 'firstName lastName patientId phone',
        })).toObject(),
        payments: [payment.toObject()],
      },
    });
  } catch (error) {
    console.error('Record Payment Error:', error);
    res.status(500).json({ success: false, message: 'Error recording payment' });
  }
};

export const generateFromOrder = async (req, res) => {
  try {
    const { patientId, orderType, items, discount = 0, discountReason = '' } = req.body;
    if (!patientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one invoice item are required' });
    }

    const patient = await Patient.findOne({ _id: patientId, tenantId: req.tenantId });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const normalizedItems = await resolveInvoiceItems(req.tenantId, items);
    if (!normalizedItems) {
      return res.status(400).json({ success: false, message: 'Every invoice line must reference an active service tariff and a positive whole-number quantity' });
    }

    const subtotal = roundMoney(normalizedItems.reduce((sum, item) => sum + item.amount, 0));
    const normalizedDiscount = roundMoney(Number(discount));
    if (subtotal <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice subtotal must be greater than zero; check the selected tariff' });
    }
    if (
      !Number.isFinite(normalizedDiscount) ||
      normalizedDiscount < 0 ||
      normalizedDiscount >= subtotal ||
      typeof discountReason !== 'string' ||
      (normalizedDiscount > 0 && !discountReason.trim())
    ) {
      return res.status(400).json({ success: false, message: 'Provide a valid fixed discount less than the subtotal and a reason when applying it' });
    }
    if (normalizedDiscount > 0 && !['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only an administrator or accountant may apply an invoice discount' });
    }

    const sequence = await getNextSequence(req.tenantId, 'INVOICE');
    const tenant = await Tenant.findById(req.tenantId).select('code');
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const invoiceNo = `${tenant.code}-INV-${new Date().getFullYear()}-${sequence.toString().padStart(4, '0')}`;
    const invoice = await Invoice.create({
      tenantId: req.tenantId,
      patientId: patient._id,
      invoiceNo,
      items: normalizedItems,
      subtotal,
      discount: roundMoney(normalizedDiscount),
      discountReason: normalizedDiscount > 0 ? discountReason.trim() : '',
      totalAmount: roundMoney(subtotal - normalizedDiscount),
      status: 'UNPAID',
    });

    res.status(201).json({ success: true, data: invoice, orderType });
  } catch (error) {
    console.error('Generate Invoice From Order Error:', error);
    res.status(500).json({ success: false, message: 'Error generating order invoice' });
  }
};
