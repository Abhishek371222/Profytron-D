import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';

describe('WalletService (security / ownership)', () => {
  let service: WalletService;
  const prisma = {
    walletTransaction: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WalletService(
      prisma as any,
      {} as any,
      { add: jest.fn() } as any,
      { add: jest.fn() } as any,
      { sendOtpEmail: jest.fn() } as any,
    );
  });

  describe('getBalance', () => {
    it('scopes groupBy to the authenticated userId only', async () => {
      prisma.walletTransaction.groupBy.mockResolvedValue([
        {
          direction: 'IN',
          status: 'CONFIRMED',
          _sum: { amount: 1000 },
        },
        {
          direction: 'OUT',
          status: 'CONFIRMED',
          _sum: { amount: 200 },
        },
        {
          direction: 'OUT',
          status: 'PENDING',
          _sum: { amount: 50 },
        },
      ]);

      const balance = await service.getBalance('user-a');

      expect(prisma.walletTransaction.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-a' },
        }),
      );
      expect(balance).toEqual({
        total: 800,
        available: 750,
        pendingIn: 0,
        pendingOut: 50,
        currency: 'INR',
      });
    });

    it('returns an empty zero balance when user has no transactions', async () => {
      prisma.walletTransaction.groupBy.mockResolvedValue([]);

      await expect(service.getBalance('user-empty')).resolves.toEqual({
        total: 0,
        available: 0,
        pendingIn: 0,
        pendingOut: 0,
        currency: 'INR',
      });
    });
  });

  describe('getTransactions (history)', () => {
    it('filters findMany and count by calling userId', async () => {
      prisma.walletTransaction.findMany.mockResolvedValue([]);
      prisma.walletTransaction.count.mockResolvedValue(0);

      const result = await service.getTransactions('user-a', { limit: 20 });

      expect(prisma.walletTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-a' }),
          take: 21,
        }),
      );
      expect(prisma.walletTransaction.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-a' }),
        }),
      );
      expect(result).toEqual({
        transactions: [],
        nextCursor: null,
        total: 0,
      });
    });
  });

  describe('getTransactionDetail (IDOR)', () => {
    it('returns 404 when the transaction exists but belongs to another user', async () => {
      // Ownership is enforced in the query (userId + id); miss → 404 (no existence leak for foreign ids).
      prisma.walletTransaction.findFirst.mockResolvedValue(null);

      await expect(
        service.getTransactionDetail(
          'user-a',
          'tx-owned-by-user-b',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.walletTransaction.findFirst).toHaveBeenCalledWith({
        where: { id: 'tx-owned-by-user-b', userId: 'user-a' },
      });
    });

    it('returns the mapped row when ownership matches', async () => {
      const createdAt = new Date('2026-08-01T00:00:00.000Z');
      prisma.walletTransaction.findFirst.mockResolvedValue({
        id: 'tx-1',
        type: 'DEPOSIT',
        status: 'CONFIRMED',
        direction: 'IN',
        amount: 100,
        balanceAfter: 100,
        billingId: 'PRF-WLT-TEST',
        paymentCategory: null,
        senderAddress: null,
        receiverAddress: null,
        externalTxnId: null,
        description: 'test',
        reference: null,
        metadataJson: null,
        createdAt,
        updatedAt: createdAt,
      });

      const row = await service.getTransactionDetail('user-a', 'tx-1');
      expect(row.id).toBe('tx-1');
      expect(row.amount).toBe(100);
    });
  });

  describe('getTransactionByBillingId (IDOR)', () => {
    const foreignTx = {
      id: 'tx-foreign',
      userId: 'user-b',
      type: 'DEPOSIT',
      status: 'CONFIRMED',
      direction: 'IN',
      amount: 500,
      balanceAfter: 500,
      billingId: 'PRF-WLT-FOREIGN',
      paymentCategory: null,
      senderAddress: null,
      receiverAddress: null,
      externalTxnId: null,
      description: null,
      reference: null,
      metadataJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'user-b',
        email: 'other@example.com',
        fullName: 'Other',
      },
    };

    it('returns 403 when a non-admin user requests another user billing id', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValue(foreignTx);

      await expect(
        service.getTransactionByBillingId('PRF-WLT-FOREIGN', {
          userId: 'user-a',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns 404 for unknown billing ids', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValue(null);

      await expect(
        service.getTransactionByBillingId('PRF-WLT-MISSING', {
          userId: 'user-a',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the row without peer user profile for the owner', async () => {
      prisma.walletTransaction.findUnique.mockResolvedValue({
        ...foreignTx,
        userId: 'user-a',
        user: { id: 'user-a', email: 'a@example.com', fullName: 'A' },
      });

      const row = await service.getTransactionByBillingId('PRF-WLT-FOREIGN', {
        userId: 'user-a',
      });
      expect(row.id).toBe('tx-foreign');
      expect(row.user).toBeUndefined();
    });
  });
});
