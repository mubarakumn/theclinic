import mongoose from 'mongoose';
import { PERMISSIONS } from '../config/permissions.js';

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    
    // Subscription Details
    subscriptionPlan: {
      type: String,
      enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
      default: 'STARTER',
    },
    subscriptionStatus: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'ANNUAL'],
      default: 'MONTHLY',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    
    // Usage Limits
    limits: {
      maxUsers: { type: Number, default: 5 },
      maxPatients: { type: Number, default: 500 },
      maxBeds: { type: Number, default: 20 },
    },

    rolePermissions: [
      {
        name: {
          type: String,
          required: true,
          uppercase: true,
          trim: true,
        },
        permissions: [
          {
            type: String,
            enum: PERMISSIONS,
          },
        ],
      },
    ],

    // Payment / Invoice History for the SaaS Platform
    paymentHistory: [
      {
        transactionId: String,
        amount: Number,
        plan: String,
        paidAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Tenant', tenantSchema);