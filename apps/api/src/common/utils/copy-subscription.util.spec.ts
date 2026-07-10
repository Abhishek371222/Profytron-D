import { SubscriptionStatus } from '@prisma/client';
import { isPaidCopySubscription } from './copy-subscription.util';

describe('isPaidCopySubscription', () => {
  const now = new Date('2026-07-10T12:00:00.000Z');

  const base = {
    status: SubscriptionStatus.ACTIVE,
    expiresAt: null as Date | null,
    trialEndsAt: null as Date | null,
    stripeSubId: null as string | null,
    planType: null as string | null,
  };

  it('accepts Stripe subscription id', () => {
    expect(
      isPaidCopySubscription(
        { ...base, stripeSubId: 'sub_stripe_123', planType: 'MONTHLY' },
        now,
      ),
    ).toBe(true);
  });

  it('accepts Razorpay payment reference stored in stripeSubId', () => {
    expect(
      isPaidCopySubscription(
        { ...base, stripeSubId: 'pay_RazorpayAbc', planType: 'MONTHLY' },
        now,
      ),
    ).toBe(true);
  });

  it('accepts paid planType without open unpaid trial (Razorpay one-shot)', () => {
    expect(
      isPaidCopySubscription({ ...base, planType: 'MONTHLY' }, now),
    ).toBe(true);
  });

  it('rejects unpaid trial without payment reference', () => {
    expect(
      isPaidCopySubscription(
        {
          ...base,
          planType: 'MONTHLY',
          trialEndsAt: new Date('2026-07-20T12:00:00.000Z'),
        },
        now,
      ),
    ).toBe(false);
  });

  it('rejects expired subscriptions', () => {
    expect(
      isPaidCopySubscription(
        {
          ...base,
          stripeSubId: 'pay_x',
          expiresAt: new Date('2026-07-01T12:00:00.000Z'),
        },
        now,
      ),
    ).toBe(false);
  });

  it('rejects non-ACTIVE status', () => {
    expect(
      isPaidCopySubscription(
        {
          ...base,
          status: SubscriptionStatus.PAUSED,
          stripeSubId: 'pay_x',
        },
        now,
      ),
    ).toBe(false);
  });
});
