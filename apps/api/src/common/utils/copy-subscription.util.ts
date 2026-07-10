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
 * True when subscription can receive CopyFactory linking / live copy.
 * Includes PROVISIONING so activate→link works before status flips to ACTIVE.
 * Excludes unpaid trials (trialEndsAt set, no payment ref).
 */
export function isPaidCopySubscription(
  sub: CopySubFields,
  now = new Date(),
): boolean {
  if (
    sub.status !== SubscriptionStatus.ACTIVE &&
    sub.status !== SubscriptionStatus.PROVISIONING
  ) {
    return false;
  }
  if (sub.expiresAt && sub.expiresAt <= now) return false;

  const hasPaymentRef = Boolean(sub.stripeSubId);
  const inUnpaidTrial =
    Boolean(sub.trialEndsAt && sub.trialEndsAt > now) && !hasPaymentRef;
  if (inUnpaidTrial) return false;

  if (hasPaymentRef) return true;

  // Paid one-shot / free marketplace activation with a known plan type
  // (Razorpay paths and free master-copy bots).
  if (sub.planType && PAID_PLAN_TYPES.has(sub.planType)) return true;

  // Free copy bots often leave planType null — still link while provisioning.
  if (sub.status === SubscriptionStatus.PROVISIONING) return true;

  return false;
}

export function isCopyStrategy(strategy: {
  masterBrokerAccountId: string | null;
}): boolean {
  return Boolean(strategy.masterBrokerAccountId);
}
