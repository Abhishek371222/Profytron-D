import {
  SubscriptionStatus,
  type UserStrategySubscription,
} from '@prisma/client';

type CopySubFields = Pick<
  UserStrategySubscription,
  'status' | 'expiresAt' | 'trialEndsAt' | 'stripeSubId' | 'planType'
>;

const PAID_PLAN_TYPES = new Set([
  'MONTHLY',
  'ANNUAL',
  'LIFETIME',
  'monthly',
  'annual',
  'lifetime',
]);

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

  if (sub.planType && PAID_PLAN_TYPES.has(sub.planType)) return true;

  if (sub.status === SubscriptionStatus.PROVISIONING) return true;

  return false;
}

export function isCopyStrategy(strategy: {
  masterBrokerAccountId: string | null;
}): boolean {
  return Boolean(strategy.masterBrokerAccountId);
}
