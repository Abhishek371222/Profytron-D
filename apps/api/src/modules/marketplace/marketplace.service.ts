import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import {
  CreateMarketplaceListingDto,
  CreateReviewDto,
  MarketplaceQueryDto,
  ReplyReviewDto,
  SubscribeStrategyDto,
} from './dto/marketplace.dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class MarketplaceService {
  private stripe: InstanceType<typeof Stripe>;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any,
    });
  }

  async findAll(query: MarketplaceQueryDto, userId?: string) {
    const where: any = {
      strategy: {
        deletedAt: null,
        isPublished: true,
      },
    };

    if (typeof query.verified === 'boolean') {
      where.strategy.isVerified = query.verified;
    }
    if (query.category) {
      where.strategy.category = query.category;
    }
    if (query.riskLevel) {
      where.strategy.riskLevel = query.riskLevel;
    }

    const listings = await this.prisma.marketplaceListing.findMany({
      where,
      include: {
        strategy: {
          include: {
            creator: {
              select: { id: true, fullName: true, avatarUrl: true, country: true },
            },
            performance: { take: 1, orderBy: { date: 'desc' } },
            reviews: { select: { rating: true } },
          },
        },
      },
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      take: query.limit,
      orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const subCounts = await this.prisma.userStrategySubscription.groupBy({
      by: ['strategyId'],
      where: { subscribedAt: { gte: sevenDaysAgo } },
      _count: { strategyId: true },
    });
    const trendingMap = new Map(
      subCounts.map((s) => [s.strategyId, s._count.strategyId]),
    );

    const normalized = listings
      .filter((listing) => {
        const prices = [listing.monthlyPrice, listing.annualPrice, listing.lifetimePrice];
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (typeof query.priceMin === 'number' && maxPrice < query.priceMin) {
          return false;
        }
        if (typeof query.priceMax === 'number' && minPrice > query.priceMax) {
          return false;
        }
        return true;
      })
      .map((listing) => {
        const avgRating =
          listing.strategy.reviews.length > 0
            ? listing.strategy.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
              listing.strategy.reviews.length
            : 0;
        return {
          ...listing,
          rating: avgRating,
          reviewCount: listing.strategy.reviews.length,
          trendingScore: trendingMap.get(listing.strategyId) ?? 0,
        };
      });

    if (query.sort === 'top-rated') {
      normalized.sort((a, b) => b.rating - a.rating);
    } else if (query.sort === 'newest') {
      normalized.sort(
        (a, b) => b.strategy.createdAt.getTime() - a.strategy.createdAt.getTime(),
      );
    } else if (query.sort === 'price') {
      normalized.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    } else {
      normalized.sort((a, b) => b.trendingScore - a.trendingScore);
    }

    normalized.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

    let subscriptionMap = new Map<string, { status: SubscriptionStatus; planType: string | null }>();
    if (userId) {
      const subs = await this.prisma.userStrategySubscription.findMany({
        where: { userId, strategyId: { in: normalized.map((item) => item.strategyId) } },
        select: { strategyId: true, status: true, planType: true },
      });
      subscriptionMap = new Map(
        subs.map((s) => [s.strategyId, { status: s.status, planType: s.planType }]),
      );
    }

    const items = normalized.map((item) => ({
      ...item,
      userSubscription: subscriptionMap.get(item.strategyId) ?? null,
    }));

    return {
      items,
      nextCursor: items.length === query.limit ? items[items.length - 1]?.id ?? null : null,
      count: items.length,
    };
  }

  async findById(id: string, userId?: string, query?: MarketplaceQueryDto) {
    const strategy = await this.prisma.strategy.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      include: {
        creator: {
          select: { id: true, fullName: true, avatarUrl: true, country: true },
        },
        listing: true,
        performance: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    if (!strategy || !strategy.listing) {
      throw new NotFoundException('Marketplace strategy not found');
    }

    const reviewsPage = query?.reviewsPage ?? 1;
    const reviewsLimit = query?.reviewsLimit ?? 10;
    const reviews = await this.prisma.strategyReview.findMany({
      where: { strategyId: id, isVisible: true },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (reviewsPage - 1) * reviewsLimit,
      take: reviewsLimit,
    });

    const totalReviews = await this.prisma.strategyReview.count({
      where: { strategyId: id, isVisible: true },
    });

    const subs = await this.prisma.userStrategySubscription.findMany({
      where: { strategyId: id, status: 'ACTIVE' },
      select: { userId: true },
    });

    let countryStats: Array<{ country: string; count: number }> = [];
    if (subs.length > 0) {
      const userCountries = await this.prisma.user.findMany({
        where: { id: { in: subs.map((s) => s.userId) } },
        select: { country: true },
      });
      const counts = userCountries.reduce<Record<string, number>>((acc, curr) => {
        const key = curr.country || 'UNKNOWN';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
      countryStats = Object.entries(counts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);
    }

    const userSubscription = userId
      ? await this.prisma.userStrategySubscription.findUnique({
          where: { userId_strategyId: { userId, strategyId: id } },
        })
      : null;

    return {
      strategy,
      listing: strategy.listing,
      reviews: {
        items: reviews,
        page: reviewsPage,
        limit: reviewsLimit,
        total: totalReviews,
      },
      countryStats,
      userSubscription,
    };
  }

  async createListing(
    strategyId: string,
    creatorId: string,
    dto: CreateMarketplaceListingDto,
  ) {
    const strategy = await this.prisma.strategy.findFirst({
      where: { id: strategyId, creatorId, deletedAt: null },
    });
    if (!strategy) {
      throw new ForbiddenException('Only strategy creator can create listing');
    }
    if (!strategy.isVerified && strategy.verificationStatus !== 'VERIFIED') {
      throw new BadRequestException('Strategy must be verified before listing');
    }

    const listing = await this.prisma.marketplaceListing.upsert({
      where: { strategyId },
      create: {
        strategyId,
        monthlyPrice: dto.monthlyPrice ?? strategy.monthlyPrice ?? 0,
        annualPrice: dto.annualPrice ?? strategy.annualPrice ?? 0,
        lifetimePrice: dto.lifetimePrice ?? strategy.lifetimePrice ?? 0,
        trialDays: dto.trialDays ?? 7,
        maxCopies: dto.maxCopies ?? strategy.maxCopies,
        isFeatured: dto.isFeatured ?? false,
      },
      update: {
        monthlyPrice: dto.monthlyPrice ?? undefined,
        annualPrice: dto.annualPrice ?? undefined,
        lifetimePrice: dto.lifetimePrice ?? undefined,
        trialDays: dto.trialDays ?? undefined,
        maxCopies: dto.maxCopies ?? undefined,
        isFeatured: dto.isFeatured ?? undefined,
      },
    });

    await this.prisma.strategy.update({
      where: { id: strategyId },
      data: {
        isPublished: true,
        monthlyPrice: listing.monthlyPrice,
        annualPrice: listing.annualPrice,
        lifetimePrice: listing.lifetimePrice,
      },
    });

    return listing;
  }

  async subscribe(strategyId: string, userId: string, dto: SubscribeStrategyDto) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { strategyId },
      include: { strategy: true },
    });

    if (!listing || !listing.strategy.isPublished || listing.strategy.deletedAt) {
      throw new NotFoundException('Strategy listing is not active');
    }

    const existingSub = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
    });
    if (existingSub && existingSub.status === 'ACTIVE') {
      throw new BadRequestException('Already subscribed to this strategy');
    }

    const planType = dto.planType;
    const isFree =
      listing.monthlyPrice <= 0 && listing.annualPrice <= 0 && listing.lifetimePrice <= 0;

    if (isFree) {
      const subscription = await this.prisma.userStrategySubscription.upsert({
        where: { userId_strategyId: { userId, strategyId } },
        create: {
          userId,
          strategyId,
          status: 'ACTIVE',
          planType,
          subscribedAt: new Date(),
        },
        update: {
          status: 'ACTIVE',
          planType,
          subscribedAt: new Date(),
        },
      });
      return { subscription, requiresPayment: false };
    }

    if (dto.useTrial && listing.trialDays > 0 && planType !== 'LIFETIME') {
      const trialEndsAt = new Date(Date.now() + listing.trialDays * 24 * 60 * 60 * 1000);
      const subscription = await this.prisma.userStrategySubscription.upsert({
        where: { userId_strategyId: { userId, strategyId } },
        create: {
          userId,
          strategyId,
          status: 'ACTIVE',
          planType,
          trialEndsAt,
          subscribedAt: new Date(),
        },
        update: {
          status: 'ACTIVE',
          planType,
          trialEndsAt,
          subscribedAt: new Date(),
        },
      });
      return {
        subscription,
        requiresPayment: false,
        trial: true,
        trialEndsAt,
      };
    }

    const amount =
      planType === 'ANNUAL'
        ? listing.annualPrice
        : planType === 'LIFETIME'
          ? listing.lifetimePrice
          : listing.monthlyPrice;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid listing amount for selected plan');
    }

    const mode = planType === 'LIFETIME' ? 'payment' : 'subscription';
    const session = await this.stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
            product_data: {
              name: listing.strategy.name,
              description: `${planType} access to ${listing.strategy.name}`,
            },
            unit_amount: Math.round(amount * 100),
            ...(planType === 'LIFETIME'
              ? {}
              : {
                  recurring: {
                    interval: planType === 'ANNUAL' ? 'year' : 'month',
                  },
                }),
          },
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/marketplace/${strategyId}`,
      metadata: {
        userId,
        strategyId,
        planType,
      },
      customer_creation: 'always',
    });

    return { checkoutUrl: session.url, requiresPayment: true };
  }

  async getFeatured() {
    return this.prisma.marketplaceListing.findMany({
      where: {
        isFeatured: true,
        strategy: { deletedAt: null, isPublished: true },
      },
      include: {
        strategy: {
          include: {
            creator: { select: { id: true, fullName: true, avatarUrl: true } },
            performance: { take: 1, orderBy: { date: 'desc' } },
          },
        },
      },
      orderBy: [{ strategy: { copiesCount: 'desc' } }, { updatedAt: 'desc' }],
      take: 8,
    });
  }

  async createReview(strategyId: string, userId: string, dto: CreateReviewDto) {
    const sub = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
    });
    if (!sub) {
      throw new ForbiddenException('Subscription required to review this strategy');
    }

    const hasAccess =
      sub.status === 'ACTIVE' ||
      (sub.status === 'CANCELLED' &&
        sub.subscribedAt &&
        Date.now() - new Date(sub.subscribedAt).getTime() > 7 * 24 * 60 * 60 * 1000);
    if (!hasAccess) {
      throw new ForbiddenException('Only active/past subscribers can review this strategy');
    }

    const existingReview = await this.prisma.strategyReview.findUnique({
      where: { strategyId_userId: { strategyId, userId } },
    });
    if (existingReview) {
      throw new BadRequestException('You already reviewed this strategy');
    }

    const review = await this.prisma.strategyReview.create({
      data: {
        strategyId,
        userId,
        rating: dto.rating,
        reviewText: dto.reviewText,
      },
    });

    const agg = await this.prisma.strategyReview.aggregate({
      where: { strategyId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      review,
      aggregate: {
        averageRating: agg._avg.rating ?? 0,
        totalReviews: agg._count.rating,
      },
    };
  }

  async replyToReview(reviewId: string, creatorId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.strategyReview.findUnique({
      where: { id: reviewId },
      include: { strategy: { select: { creatorId: true } } },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.strategy.creatorId !== creatorId) {
      throw new ForbiddenException('Only strategy creator can reply to reviews');
    }

    return this.prisma.strategyReview.update({
      where: { id: reviewId },
      data: { creatorReply: dto.replyText },
    });
  }
}
