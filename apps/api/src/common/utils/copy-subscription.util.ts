import {
  SubscriptionStatus,
  type UserStrategySubscription,
} from '@prisma/client';

type CopySubFields = Pick<
  UserStrategySubscription,
  'status' | 'expiresAt' | 'trialEndsAt' | 'stripeSubId' | 'planType'
>;

/** True when subscription is active, not expired, and payment was completed (no unpaid trial). */
export function isPaidCopySubscription(
  sub: CopySubFields,
  now = new Date(),
): boolean {
  if (sub.status !== SubscriptionStatus.ACTIVE) return false;
  if (sub.expiresAt && sub.expiresAt <= now) return false;
  if (sub.trialEndsAt && sub.trialEndsAt > now && !sub.stripeSubId) {
    return false;
  }
  return Boolean(sub.stripeSubId);
}

export function isCopyStrategy(strategy: {
  masterBrokerAccountId: string | null;
}): boolean {
  return Boolean(strategy.masterBrokerAccountId);
}
