import Invoice from '../models/Invoice.js';
import getNextSequence from '../utils/getNextSequence.js';

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ tenantId: req.user.tenantId })
      .populate('patientId', 'firstName lastName mrn phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching invoices', error: error.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { patientId, items, discount = 0 } = req.body;

    const seq = await getNextSequence(req.user.tenantId, 'INVOICE');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const finalAmount = totalAmount - discount;

    const invoice = await Invoice.create({
      tenantId: req.user.tenantId,
      patientId,
      invoiceNumber,
      items,
      subtotal: totalAmount,
      discount,
      totalAmount: finalAmount,
      balanceDue: finalAmount,
      status: 'UNPAID',
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating invoice', error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
      .populate('patientId', 'firstName lastName mrn email phone');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching invoice', error: error.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { amountPaid, paymentMethod } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    invoice.amountPaid += Number(amountPaid);
    invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;

    if (invoice.balanceDue <= 0) {
      invoice.status = 'PAID';
      invoice.balanceDue = 0;
    } else {
      invoice.status = 'PARTIAL';
    }

    invoice.paymentHistory.push({
      amount: amountPaid,
      method: paymentMethod,
      receivedBy: req.user._id,
      date: new Date(),
    });

    await invoice.save();
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error recording payment', error: error.message });
  }
};

export const generateFromOrder = async (req, res) => {
  try {
    const { patientId, orderType, items } = req.body; // e.g. orderType: 'LAB' | 'PRESCRIPTION' | 'RADIOLOGY'

    const seq = await getNextSequence(req.user.tenantId, 'INVOICE');
    const invoiceNumber = `INV-${new Date().getFullYear()}-${seq.toString().padStart(4, '0')}`;

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const invoice = await Invoice.create({
      tenantId: req.user.tenantId,
      patientId,
      invoiceNumber,
      items,
      subtotal: totalAmount,
      totalAmount,
      balanceDue: totalAmount,
      notes: `Generated automatically for ${orderType}`,
      status: 'UNPAID',
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating order invoice', error: error.message });
  }
};