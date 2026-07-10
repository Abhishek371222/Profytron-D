import {
  SubscriptionStatus,
  type UserStrategySubscription,
} from '@prisma/client';

type CopySubFields = Pick<
  UserStrategySubscription,
  'status' | 'expiresAt' | 'trialEndsAt' | 'stripeSubId' | 'planType'
>;

/** Plan types that imply a completed marketplace purchase (Stripe or Razorpay). */
const PAID_PLAN_TYPES = new Set([
  'MONTHLY',
  'ANNUAL',
  'LIFETIME',
  'monthly',
  'annual',
  'lifetime',
]);

/**
 * True when subscription is active, not expired, and payment was completed
 * (no unpaid trial). `stripeSubId` holds a Stripe subscription id OR a
 * Razorpay/order payment reference after activateSubscription.
 */
export function isPaidCopySubscription(
  sub: CopySubFields,
  now = new Date(),
): boolean {
  if (sub.status !== SubscriptionStatus.ACTIVE) return false;
  if (sub.expiresAt && sub.expiresAt <= now) return false;

  const hasPaymentRef = Boolean(sub.stripeSubId);
  const inUnpaidTrial =
    Boolean(sub.trialEndsAt && sub.trialEndsAt > now) && !hasPaymentRef;
  if (inUnpaidTrial) return false;

  if (hasPaymentRef) return true;

  // Paid one-shot / non-Stripe activation that set a known paid plan type
  // (Razorpay paths that store planType without leaving an open unpaid trial).
  if (sub.planType && PAID_PLAN_TYPES.has(sub.planType)) return true;

  return false;
}

export function isCopyStrategy(strategy: {
  masterBrokerAccountId: string | null;
}): boolean {
  return Boolean(strategy.masterBrokerAccountId);
}
