import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TradingGateway } from '../trading/trading.gateway';

@Injectable()
export class WalletService {
  private stripe: any;
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any,
    });
  }


  async getBalance(userId: string) {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { userId },
    });

    // Sum ledger: total amount (positive/negative)
    const balance = transactions.reduce(
      (acc: any, curr: any) => acc + curr.amount,
      0,
    );
    return { balance, currency: 'USD' };
  }

  async createDepositIntent(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'usd',
      metadata: { userId },
    });

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    };
  }

  async handleStripeWebhook(payload: any, sig: string) {
    this.logger.log(`Processing Stripe Webhook Event`);
    const event = payload; // Signature verification done in controller middleware

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const userId = intent.metadata.userId;
      const amount = intent.amount / 100;

      await this.prisma.walletTransaction.create({
        data: {
          userId,
          amount,
          direction: 'IN',
          type: 'DEPOSIT',
          status: 'CONFIRMED',
          balanceAfter: 0, // In a real system, we'd calculate this or use a trigger
          stripePaymentId: intent.id,
          description: 'Stripe Deposit',
          idempotencyKey: `dep_${intent.id}`,
        },
      });
      this.logger.log(`Deposit confirmed for user ${userId}: ${amount}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, strategyId } = session.metadata;
      const amount = session.amount_total / 100;

      await this.prisma.$transaction(async (tx) => {
        // 1. Record Transaction
        await tx.walletTransaction.create({
          data: {
            userId,
            amount: -amount,
            direction: 'OUT',
            type: 'SUBSCRIPTION_PAYMENT',
            status: 'CONFIRMED',
            balanceAfter: 0,
            stripePaymentId: session.id,
            description: `Subscription for strategy ${strategyId}`,
            idempotencyKey: `sub_${session.id}`,
          },
        });

        // 2. Activate Subscription
        await tx.userStrategySubscription.upsert({
          where: { userId_strategyId: { userId, strategyId } },
          create: {
            userId,
            strategyId,
            status: 'ACTIVE',
            planType: 'MONTHLY',
            subscribedAt: new Date(),
          },
          update: {
            status: 'ACTIVE',
            subscribedAt: new Date(),
          },
        });
      });
      this.logger.log(`Subscription activated for user ${userId} -> Strategy ${strategyId}`);
    }
  }
}

