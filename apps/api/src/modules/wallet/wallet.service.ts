import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TradingGateway } from '../trading/trading.gateway';

@Injectable()
export class WalletService {
  private stripe: any;

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
    const balance = transactions.reduce((acc: any, curr: any) => acc + curr.amount, 0);
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
    // Logic for verifying stripe signature and updating transactions
    // This will be called by PaymentController
    const event = payload; // Signature verification done in Controller middleware
    
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const userId = intent.metadata.userId;
      const amount = intent.amount / 100;

      await (this.prisma as any).walletTransaction.create({
        data: {
          userId,
          amount,
          type: 'DEPOSIT',
          stripePaymentId: intent.id,
          description: 'Stripe Deposit',
        },
      });
    }
  }
}
