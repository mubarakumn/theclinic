// utils/checkSubscriptionLimits.js
import Tenant from '../models/Tenant.js';

export const checkLimit = async (tenantId, resourceModel, limitKey) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new Error('Tenant not found');

  if (tenant.subscriptionStatus !== 'ACTIVE') {
    throw new Error('Your subscription is not active. Please renew to continue.');
  }

  const currentCount = await resourceModel.countDocuments({ tenantId });
  const maxLimit = tenant.limits[limitKey];

  if (currentCount >= maxLimit) {
    throw new Error(`Limit reached for ${limitKey} (${currentCount}/${maxLimit}). Upgrade your plan.`);
  }

  return true;
};