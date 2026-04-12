import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class MarketplaceService {
  private stripe: InstanceType<typeof Stripe>;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any,
    });
  }

  async exploreListings() {
    return this.prisma.marketplaceListing.findMany({
      where: { strategy: { deletedAt: null, isPublished: true } },
      include: {
        strategy: {
          include: {
            creator: { select: { fullName: true, avatarUrl: true } },
            performance: { take: 1, orderBy: { date: 'desc' } },
          },
        },
      },
    });
  }

  async createCheckoutSession(userId: string, listingId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: { strategy: true },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.strategy.name,
              description: `Subscription for ${listing.strategy.name}`,
            },
            unit_amount: Math.round(listing.monthlyPrice * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/strategies?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/marketplace`,
      metadata: {
        userId,
        strategyId: listing.strategyId,
      },
    });

    return { url: session.url };
  }
}
