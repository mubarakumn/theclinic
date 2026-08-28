import express from 'express';
import {
  getInvoices,
  createInvoice,
  getInvoiceById,
  recordPayment,
  generateFromOrder,
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(authorize('ACCOUNTANT', 'ADMIN', 'RECEPTIONIST'), createInvoice);

router.route('/from-order')
  .post(authorize('ACCOUNTANT', 'ADMIN'), generateFromOrder);

router.route('/:id')
  .get(getInvoiceById);

router.route('/:id/payments')
  .post(authorize('ACCOUNTANT', 'ADMIN', 'RECEPTIONIST'), recordPayment);

export default router;