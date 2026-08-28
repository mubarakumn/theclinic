import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'DISPENSE', 'RECORD_PAYMENT'
    },
    module: {
      type: String,
      required: true, // e.g., 'PATIENT', 'MEDICAL_RECORD', 'INVOICE', 'LAB', 'PRESCRIPTION', 'USER'
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    metadata: {
      type: Object, // Optional extra details (e.g., resourceId, altered fields)
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index for efficient sorting and filtering
auditLogSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);