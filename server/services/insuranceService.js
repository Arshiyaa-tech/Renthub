const prisma = require('../utils/prisma');

const INSURANCE_PLANS = [
  {
    id: 'standard',
    name: 'Standard Damage Protection',
    provider: 'RentHubProtect',
    premium: 12,
    coverageAmount: 1000,
    description: 'Covers accidental damage up to $1,000',
  },
  {
    id: 'premium',
    name: 'Premium Damage Protection',
    provider: 'RentHubProtect',
    premium: 25,
    coverageAmount: 3000,
    description: 'Covers accidental damage up to $3,000',
  },
];

const getPlans = async () => INSURANCE_PLANS;

const purchasePolicy = async ({ bookingId, planId, userId }) => {
  const plan = INSURANCE_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error('Invalid insurance plan: ' + planId);
  const policyNumber = 'RHP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const policy = await prisma.insurancePolicy.create({
    data: {
      bookingId,
      provider: plan.provider,
      planName: plan.name,
      premium: plan.premium,
      coverageAmount: plan.coverageAmount,
      status: 'ACTIVE',
      policyNumber,
    },
  });
  return policy;
};

const submitClaim = async ({ policyId, damageAmount, description }) => {
  return { success: true, claimId: 'CLM-' + Date.now(), status: 'UNDER_REVIEW' };
};

const getPolicyForBooking = async (bookingId) => {
  const policy = await prisma.insurancePolicy.findUnique({ where: { bookingId } });
  if (!policy) return null;
  return { ...policy, isActive: policy.status === 'ACTIVE', coverageLabel: 'Covered up to $' + policy.coverageAmount };
};

module.exports = { getPlans, purchasePolicy, submitClaim, getPolicyForBooking, INSURANCE_PLANS };
