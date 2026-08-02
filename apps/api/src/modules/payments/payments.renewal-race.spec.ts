import { PaymentsService } from './payments.service';

/**
 * Verifies handleSubscriptionInvoicePaid refuses to reactivate via conditional
 * updateMany when a concurrent cancel wins the race (TOCTOU close).
 */
describe('PaymentsService.handleSubscriptionInvoicePaid race', () => {
  function buildService(updateManyCount: number) {
    const subscription = {
      id: 'uss_1',
      userId: 'user_1',
      strategyId: 'strat_1',
      stripeSubId: 'sub_stripe_1',
      status: 'ACTIVE',
      cancelledAt: null,
      planType: 'MONTHLY',
    };

    const updateMany = jest.fn().mockResolvedValue({ count: updateManyCount });
    const marketplaceListingUpdate = jest.fn().mockResolvedValue({});
    const strategyUpdate = jest.fn().mockResolvedValue({});

    const prisma = {
      userStrategySubscription: {
        findFirst: jest.fn().mockResolvedValue(subscription),
        updateMany,
        update: jest.fn(),
      },
      marketplaceListing: {
        update: marketplaceListingUpdate,
        findUnique: jest.fn().mockResolvedValue({ creatorSharePct: 0.7 }),
      },
      strategy: {
        update: strategyUpdate,
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ creatorId: 'creator_1' }),
      },
      payment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockImplementation(async (fn: any) =>
        fn({
          userStrategySubscription: { updateMany, update: jest.fn() },
          marketplaceListing: { update: marketplaceListingUpdate },
          strategy: { update: strategyUpdate },
        }),
      ),
    };

    const service = Object.create(PaymentsService.prototype) as PaymentsService;
    Object.assign(service, {
      logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
      prisma,
      getPeriodEndDate: () => new Date('2026-09-01T00:00:00.000Z'),
      createSubscriptionPaymentRecord: jest.fn().mockResolvedValue(undefined),
      creditWallet: jest.fn().mockResolvedValue(undefined),
      notifications: { create: jest.fn().mockResolvedValue(undefined) },
    });

    return {
      service,
      prisma,
      updateMany,
      marketplaceListingUpdate,
      strategyUpdate,
    };
  }

  it('reactivates when updateMany matches a non-cancelled row', async () => {
    const { service, updateMany, marketplaceListingUpdate } = buildService(1);

    await (service as any).handleSubscriptionInvoicePaid('sub_stripe_1', {
      id: 'inv_1',
      amount_paid: 1000,
    });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'uss_1',
          cancelledAt: null,
          status: { not: 'CANCELLED' },
        }),
        data: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
    expect(marketplaceListingUpdate).toHaveBeenCalled();
    expect((service as any).createSubscriptionPaymentRecord).toHaveBeenCalled();
    expect((service as any).creditWallet).toHaveBeenCalled();
  });

  it('skips revenue/payment side effects when concurrent cancel wins', async () => {
    const { service, updateMany, marketplaceListingUpdate, strategyUpdate } =
      buildService(0);

    await (service as any).handleSubscriptionInvoicePaid('sub_stripe_1', {
      id: 'inv_race',
      amount_paid: 1000,
    });

    expect(updateMany).toHaveBeenCalled();
    expect(marketplaceListingUpdate).not.toHaveBeenCalled();
    expect(strategyUpdate).not.toHaveBeenCalled();
    expect(
      (service as any).createSubscriptionPaymentRecord,
    ).not.toHaveBeenCalled();
    expect((service as any).creditWallet).not.toHaveBeenCalled();
  });

  it('skips entirely when subscription already cancelled on read', async () => {
    const { service, prisma, updateMany } = buildService(1);
    prisma.userStrategySubscription.findFirst.mockResolvedValue({
      id: 'uss_1',
      userId: 'user_1',
      strategyId: 'strat_1',
      stripeSubId: 'sub_stripe_1',
      status: 'CANCELLED',
      cancelledAt: new Date(),
      planType: 'MONTHLY',
    });

    await (service as any).handleSubscriptionInvoicePaid('sub_stripe_1', {
      id: 'inv_2',
      amount_paid: 1000,
    });

    expect(updateMany).not.toHaveBeenCalled();
  });
});
