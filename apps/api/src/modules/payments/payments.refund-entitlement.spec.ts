/**
 * Day 16 P0-1: full refund must revoke paid access and claw back creator credit.
 */
import { PaymentsService } from './payments.service';

function buildService(prisma: Record<string, unknown>) {
  const service = Object.create(PaymentsService.prototype) as PaymentsService & {
    logger: { log: jest.Mock; warn: jest.Mock; error: jest.Mock };
    prisma: typeof prisma;
    notifications: { create: jest.Mock };
    emailService: { sendPaymentEmail: jest.Mock };
    creditWallet: PaymentsService['creditWallet'];
    tierFromPlanName: (n: string) => string;
  };
  Object.assign(service, {
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    prisma,
    notifications: { create: jest.fn().mockResolvedValue(undefined) },
    emailService: { sendPaymentEmail: jest.fn().mockResolvedValue(undefined) },
    tierFromPlanName: (name: string) =>
      /pro/i.test(name) ? 'PRO' : /starter/i.test(name) ? 'STARTER' : 'FREE',
  });
  // Use real creditWallet bound to this instance (needs prisma/transaction).
  service.creditWallet = PaymentsService.prototype.creditWallet.bind(service);
  return service;
}

describe('PaymentsService.reconcileRefund — entitlement (P0-1)', () => {
  it('cancels platform subscription linked by paymentId on full refund', async () => {
    const payment = {
      id: 'pay-db-1',
      userId: 'user-1',
      amount: 999,
      status: 'COMPLETED',
      currency: 'INR',
      razorpayPaymentId: 'pay_rzp_1',
      stripePaymentId: null,
      metadataJson: { type: 'platform_subscription', planId: 'plan-1' },
    };

    const prisma = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({ ...payment, status: 'REFUNDED' }),
      },
      userSubscription: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      userStrategySubscription: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      walletTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const service = buildService(prisma);
    const result = await service.reconcileRefund({
      userId: 'user-1',
      amount: 999,
      refundId: 'rfnd_1',
      source: 'razorpay',
      paymentDbId: payment.id,
      gatewayPaymentId: payment.razorpayPaymentId,
    });

    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: payment.id },
        data: expect.objectContaining({ status: 'REFUNDED' }),
      }),
    );
    expect(prisma.userSubscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentId: payment.id }),
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    );
    expect(result.accessRevoked).toBe(true);
    expect(result.fullRefund).toBe(true);
  });

  it('claws back marketplace creator credit and cancels strategy sub', async () => {
    const payment = {
      id: 'pay-db-2',
      userId: 'buyer-1',
      amount: 500,
      status: 'COMPLETED',
      currency: 'INR',
      razorpayPaymentId: null,
      stripePaymentId: 'cs_test_1',
      metadataJson: {
        type: 'marketplace_subscription',
        strategyId: 'strat-1',
      },
    };

    const priorSale = {
      id: 'wtx-sale',
      userId: 'creator-1',
      amount: 400,
      type: 'MARKETPLACE_SALE',
      direction: 'IN',
      status: 'CONFIRMED',
      idempotencyKey: 'creator_credit_cs_test_1',
    };

    const walletTx = {
      findFirst: jest.fn().mockImplementation((args: { where?: { type?: unknown; idempotencyKey?: { in?: string[] } } }) => {
        const keys = args?.where?.idempotencyKey?.in ?? [];
        // Creator sale lookup (revoke) vs deposit lookup
        if (keys.some((k) => String(k).startsWith('creator_credit_'))) {
          return Promise.resolve(priorSale);
        }
        return Promise.resolve(null);
      }),
      findUnique: jest.fn().mockResolvedValue(null),
      groupBy: jest.fn().mockResolvedValue([
        { direction: 'IN', _sum: { amount: 400 } },
        { direction: 'OUT', _sum: { amount: 0 } },
      ]),
      create: jest
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'wtx-claw', ...data }),
        ),
    };

    const prisma = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({ ...payment, status: 'REFUNDED' }),
      },
      userSubscription: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findFirst: jest.fn(),
      },
      userStrategySubscription: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      walletTransaction: walletTx,
      user: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          $executeRaw: jest.fn(),
          walletTransaction: walletTx,
        }),
      ),
    };

    const service = buildService(prisma);
    const result = await service.reconcileRefund({
      userId: 'buyer-1',
      amount: 500,
      refundId: 'rfnd_mkt_1',
      source: 'stripe',
      paymentDbId: payment.id,
      gatewayPaymentId: payment.stripePaymentId,
    });

    expect(prisma.userStrategySubscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'buyer-1',
          strategyId: 'strat-1',
        }),
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    );
    expect(walletTx.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'creator-1',
          direction: 'OUT',
          type: 'WITHDRAWAL',
          idempotencyKey: 'creator_refund_rfnd_mkt_1',
        }),
      }),
    );
    expect(result.accessRevoked).toBe(true);
    expect(result.creatorClawedBack).toBe(true);
  });

  it('does not cancel access on partial refund', async () => {
    const payment = {
      id: 'pay-db-3',
      userId: 'user-1',
      amount: 1000,
      status: 'COMPLETED',
      currency: 'INR',
      razorpayPaymentId: 'pay_partial',
      stripePaymentId: null,
      metadataJson: { type: 'platform_subscription', planId: 'plan-1' },
    };

    const prisma = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({ ...payment, status: 'REFUNDED' }),
      },
      userSubscription: {
        updateMany: jest.fn(),
        findFirst: jest.fn(),
      },
      userStrategySubscription: {
        updateMany: jest.fn(),
      },
      walletTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      user: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const service = buildService(prisma);
    const result = await service.reconcileRefund({
      userId: 'user-1',
      amount: 100,
      refundId: 'rfnd_partial',
      source: 'admin',
      paymentDbId: payment.id,
    });

    expect(prisma.userSubscription.updateMany).not.toHaveBeenCalled();
    expect(result.fullRefund).toBe(false);
    expect(result.accessRevoked).toBe(false);
  });
});
