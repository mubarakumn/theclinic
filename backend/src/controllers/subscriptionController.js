import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Bed from '../models/Bed.js';

// Plan tiers configuration
const PLAN_LIMITS = {
  STARTER: { maxUsers: 5, maxPatients: 500, maxBeds: 10 },
  PROFESSIONAL: { maxUsers: 25, maxPatients: 5000, maxBeds: 50 },
  ENTERPRISE: { maxUsers: 9999, maxPatients: 999999, maxBeds: 9999 },
};

// Get current tenant's subscription status & usage metrics
export const getSubscriptionStatus = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    // Aggregate real-time resource usage
    const [userCount, patientCount, bedCount] = await Promise.all([
      User.countDocuments({ tenantId: req.tenantId }),
      Patient.countDocuments({ tenantId: req.tenantId }),
      Bed.countDocuments({ tenantId: req.tenantId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        plan: tenant.subscriptionPlan,
        status: tenant.subscriptionStatus,
        billingCycle: tenant.billingCycle,
        startDate: tenant.startDate,
        endDate: tenant.endDate,
        limits: tenant.limits,
        usage: {
          users: userCount,
          patients: patientCount,
          beds: bedCount,
        },
        paymentHistory: tenant.paymentHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscription status', error: error.message });
  }
};

// Upgrade or change tenant subscription plan
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { plan, billingCycle, transactionId, amountPaid } = req.body;

    if (!PLAN_LIMITS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan' });
    }

    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    // Calculate new expiration date
    const now = new Date();
    const endDate = new Date(now);
    if (billingCycle === 'ANNUAL') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Update tenant subscription details & limits
    tenant.subscriptionPlan = plan;
    tenant.billingCycle = billingCycle || tenant.billingCycle;
    tenant.subscriptionStatus = 'ACTIVE';
    tenant.startDate = now;
    tenant.endDate = endDate;
    tenant.limits = PLAN_LIMITS[plan];

    if (transactionId && amountPaid) {
      tenant.paymentHistory.push({
        transactionId,
        amount: amountPaid,
        plan,
        paidAt: now,
        status: 'SUCCESS',
      });
    }

    await tenant.save();

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${plan} plan`,
      data: tenant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating subscription plan', error: error.message });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { subscriptionStatus: 'CANCELLED' },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: tenant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling subscription', error: error.message });
  }
};