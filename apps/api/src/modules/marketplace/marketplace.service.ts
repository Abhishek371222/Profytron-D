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
  UpdateSubscriptionRiskDto,
} from './dto/marketplace.dto';
import {
  Prisma,
  SubscriptionBillingModel,
  SubscriptionStatus,
  TradeStatus,
} from '@prisma/client';
import { getTierLimits } from '../../common/constants/pricing.constants';
import { buildStrategyAnalytics } from './strategy-analytics.builder';
import {
  ActivationService,
  ACTIVATION_EVENTS,
} from '../growth/activation.service';
import { RedisService } from '../auth/redis.service';
import { requireActiveMt5Broker } from '../../common/utils/broker-requirement.util';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionProvisioningService } from '../provisioning/subscription-provisioning.service';
import { CopyFactorySyncService } from '../copy-factory/copy-factory-sync.service';
import { StrategyDocumentsService } from './strategy-documents.service';

// Short TTLs keep public marketplace reads fast without serving badly stale
// data. Listings change rarely; subscription/price edits surface within a
// minute (and listing mutations actively bust the relevant keys).
const FEATURED_TTL = 60;
const LISTINGS_TTL = 30;
const STRATEGY_ANALYTICS_TTL = 60;
const DEFAULT_PROFIT_SHARE_UPFRONT_FEE_INR = 149;
const DEFAULT_PROFIT_SHARE_PCT = 30;

@Injectable()
export class MarketplaceService {
  private stripe: InstanceType<typeof Stripe>;

  constructor(
    private prisma: PrismaService,
    private activationService: ActivationService,
    private readonly redis: RedisService,
    private readonly paymentsService: PaymentsService,
    private readonly provisioning: SubscriptionProvisioningService,
    private readonly copyFactorySync: CopyFactorySyncService,
    private readonly strategyDocuments: StrategyDocumentsService,
  ) {
    this.stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-01-27' as any,
        })
      : (null as any);
  }

  async findAll(query: MarketplaceQueryDto, userId?: string) {
    // Anonymous browsing is identical for every visitor, so it is safe to
    // cache by query. Authenticated requests overlay per-user subscription
    // state and are computed fresh.
    if (!userId) {
      const cacheKey = `cache:mkt:listings:${this.listingsCacheKey(query)}`;
      return this.redis.cached(cacheKey, LISTINGS_TTL, () =>
        this.computeListings(query, undefined),
      );
    }
    return this.computeListings(query, userId);
  }

  private listingsCacheKey(query: MarketplaceQueryDto): string {
    return JSON.stringify({
      verified: query.verified ?? null,
      category: query.category ?? null,
      riskLevel: query.riskLevel ?? null,
      assetClass: query.assetClass ?? null,
      timeframe: query.timeframe ?? null,
      q: query.q ?? null,
      cursor: query.cursor ?? null,
      limit: query.limit ?? null,
      priceMin: query.priceMin ?? null,
      priceMax: query.priceMax ?? null,
      sort: query.sort ?? null,
    });
  }

  private async computeListings(query: MarketplaceQueryDto, userId?: string) {
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
    if (query.assetClass) {
      where.strategy.assetClass = query.assetClass;
    }
    if (query.timeframe) {
      where.strategy.timeframe = query.timeframe;
    }
    if (query.q) {
      where.strategy.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { creator: { fullName: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    const take = query.limit ?? 12;
    const [listings, total] = await Promise.all([
      this.prisma.marketplaceListing.findMany({
        where,
        include: {
          strategy: {
            include: {
              creator: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  country: true,
                },
              },
              performance: { take: 1, orderBy: { date: 'desc' } },
              // Load only ratings for visible reviews — no text/author fields needed for list view.
              reviews: { where: { isVisible: true }, select: { rating: true } },
            },
          },
        },
        ...(query.cursor
          ? {
              cursor: { id: query.cursor },
              skip: 1,
            }
          : {}),
        take,
        orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.marketplaceListing.count({ where }),
    ]);

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
        const prices = [
          listing.monthlyPrice,
          listing.annualPrice,
          listing.lifetimePrice,
        ];
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
            ? listing.strategy.reviews.reduce(
                (acc, curr) => acc + curr.rating,
                0,
              ) / listing.strategy.reviews.length
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
        (a, b) =>
          b.strategy.createdAt.getTime() - a.strategy.createdAt.getTime(),
      );
    } else if (query.sort === 'price') {
      normalized.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    } else if (query.sort === 'subscribers') {
      normalized.sort(
        (a, b) => b.strategy.copiesCount - a.strategy.copiesCount,
      );
    } else if (query.sort === 'performance') {
      normalized.sort(
        (a, b) =>
          Number(b.strategy.performance?.[0]?.winRate ?? 0) -
          Number(a.strategy.performance?.[0]?.winRate ?? 0),
      );
    } else {
      normalized.sort((a, b) => b.trendingScore - a.trendingScore);
    }

    normalized.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

    let subscriptionMap = new Map<
      string,
      { status: SubscriptionStatus; planType: string | null }
    >();
    if (userId) {
      const subs = await this.prisma.userStrategySubscription.findMany({
        where: {
          userId,
          strategyId: { in: normalized.map((item) => item.strategyId) },
        },
        select: { strategyId: true, status: true, planType: true },
      });
      subscriptionMap = new Map(
        subs.map((s) => [
          s.strategyId,
          { status: s.status, planType: s.planType },
        ]),
      );
    }

    const items = normalized.map((item) => ({
      ...item,
      userSubscription: subscriptionMap.get(item.strategyId) ?? null,
    }));

    return {
      items,
      nextCursor:
        items.length === take ? (items[items.length - 1]?.id ?? null) : null,
      count: items.length,
      total,
    };
  }

  async findById(id: string, userId?: string, query?: MarketplaceQueryDto) {
    const strategy = await this.prisma.strategy.findFirst({
      where: { id, deletedAt: null },
      include: {
        creator: {
          select: { id: true, fullName: true, avatarUrl: true, country: true },
        },
        listing: true,
        performance: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    if (!strategy) {
      throw new NotFoundException('Marketplace strategy not found');
    }

    const isOwner = Boolean(userId && strategy.creatorId === userId);
    if (!strategy.isPublished && !isOwner) {
      throw new NotFoundException('Marketplace strategy not found');
    }
    if (!strategy.listing && !isOwner) {
      throw new NotFoundException('Marketplace strategy not found');
    }

    const reviewsPage = query?.reviewsPage ?? 1;
    const reviewsLimit = query?.reviewsLimit ?? 10;
    const reviews = await this.prisma.strategyReview.findMany({
      where: { strategyId: id, isVisible: true },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
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
      const counts = userCountries.reduce<Record<string, number>>(
        (acc, curr) => {
          const key = curr.country || 'UNKNOWN';
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        },
        {},
      );
      countryStats = Object.entries(counts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);
    }

    const userSubscription = userId
      ? await this.prisma.userStrategySubscription.findUnique({
          where: { userId_strategyId: { userId, strategyId: id } },
        })
      : null;

    const documents =
      isOwner && !strategy.isPublished
        ? await this.strategyDocuments.listDocuments(id)
        : await this.strategyDocuments.listPublishedDocuments(id);

    const monthlyPrice = Number(
      strategy.listing?.monthlyPrice ?? strategy.monthlyPrice ?? 0,
    );
    const annualPrice = Number(
      strategy.listing?.annualPrice ?? strategy.annualPrice ?? 0,
    );

    return {
      strategy: {
        ...strategy,
        monthlyPrice,
        annualPrice,
        lifetimePrice: Number(strategy.lifetimePrice ?? 0),
        copiesCount: strategy.copiesCount ?? 0,
        listing: strategy.listing
          ? {
              ...strategy.listing,
              monthlyPrice,
              annualPrice,
              lifetimePrice: Number(strategy.listing.lifetimePrice ?? 0),
            }
          : null,
      },
      listing: strategy.listing
        ? {
            ...strategy.listing,
            monthlyPrice,
            annualPrice,
            lifetimePrice: Number(strategy.listing.lifetimePrice ?? 0),
          }
        : {
            // Owner preview for pending bots without a public listing yet
            strategyId: strategy.id,
            monthlyPrice,
            annualPrice,
            lifetimePrice: Number(strategy.lifetimePrice ?? 0),
            trialDays: 7,
            isFeatured: false,
          },
      documents,
      reviews: {
        items: reviews,
        page: reviewsPage,
        limit: reviewsLimit,
        total: totalReviews,
      },
      countryStats,
      userSubscription,
      preview: isOwner && !strategy.isPublished,
    };
  }

  async getStrategyAnalytics(id: string, query?: MarketplaceQueryDto) {
    const tradesPage = query?.tradesPage ?? 1;
    const tradesLimit = query?.tradesLimit ?? 20;
    return this.redis.cached(
      `cache:mkt:analytics:${id}:${tradesPage}:${tradesLimit}`,
      STRATEGY_ANALYTICS_TTL,
      () => this.computeStrategyAnalytics(id, query),
    );
  }

  private async computeStrategyAnalytics(
    id: string,
    query?: MarketplaceQueryDto,
  ) {
    const strategy = await this.prisma.strategy.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      select: {
        id: true,
        name: true,
        isVerified: true,
        verificationStatus: true,
        configJson: true,
        biasCheckJson: true,
        masterBrokerAccountId: true,
        createdAt: true,
      },
    });

    if (!strategy) {
      throw new NotFoundException('Marketplace strategy not found');
    }

    const tradesPage = query?.tradesPage ?? 1;
    const tradesLimit = query?.tradesLimit ?? 20;

    const [performance, trades, openTrades, tradeHistory, totalTrades] =
      await Promise.all([
        this.prisma.strategyPerformance.findMany({
          where: { strategyId: id },
          orderBy: { date: 'asc' },
        }),
        this.prisma.trade.findMany({
          where: { strategyId: id },
          orderBy: { closedAt: 'asc' },
        }),
        this.prisma.trade.findMany({
          where: { strategyId: id, status: TradeStatus.OPEN },
        }),
        this.prisma.trade.findMany({
          where: { strategyId: id, status: TradeStatus.CLOSED },
          orderBy: { closedAt: 'desc' },
          skip: (tradesPage - 1) * tradesLimit,
          take: tradesLimit,
          select: {
            id: true,
            symbol: true,
            direction: true,
            volume: true,
            openPrice: true,
            closePrice: true,
            profit: true,
            openedAt: true,
            closedAt: true,
            status: true,
          },
        }),
        this.prisma.trade.count({
          where: { strategyId: id, status: TradeStatus.CLOSED },
        }),
      ]);

    const analytics = buildStrategyAnalytics({
      performance,
      trades,
      openTrades,
      configJson: (strategy.configJson as Record<string, unknown>) ?? {},
      biasCheckJson:
        (strategy.biasCheckJson as Record<string, unknown>) ?? null,
      isVerified: strategy.isVerified,
      verificationStatus: strategy.verificationStatus,
      masterBrokerAccountId: strategy.masterBrokerAccountId,
      createdAt: strategy.createdAt,
    });

    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      analytics,
      tradeHistory: {
        items: tradeHistory.map((trade) => ({
          id: trade.id,
          asset: trade.symbol,
          type: trade.direction === 'LONG' ? 'Buy' : 'Sell',
          openPrice: trade.openPrice,
          closePrice: trade.closePrice,
          volume: trade.volume,
          openedAt: trade.openedAt,
          closedAt: trade.closedAt,
          pnl: trade.profit ?? 0,
        })),
        page: tradesPage,
        limit: tradesLimit,
        total: totalTrades,
      },
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

    // Surface listing/price changes immediately instead of waiting out the TTL.
    await this.redis.del('cache:mkt:featured');

    return listing;
  }

  async subscribe(
    strategyId: string,
    userId: string,
    dto: SubscribeStrategyDto,
  ) {
    const broker = await requireActiveMt5Broker(this.prisma, userId);

    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { strategyId },
      include: { strategy: true },
    });

    if (
      !listing ||
      !listing.strategy.isPublished ||
      listing.strategy.deletedAt
    ) {
      throw new NotFoundException('Strategy listing is not active');
    }

    const existingSub = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
    });
    if (
      existingSub &&
      (existingSub.status === SubscriptionStatus.ACTIVE ||
        existingSub.status === SubscriptionStatus.PROVISIONING)
    ) {
      throw new BadRequestException('Already subscribed to this bot');
    }

    // Enforce the plan's concurrent bot subscription quota (server-side).
    const activeCopies = await this.prisma.userStrategySubscription.count({
      where: {
        userId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PROVISIONING],
        },
        strategyId: { not: strategyId },
      },
    });
    const quotaUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, country: true },
    });
    const { maxCopyTrades } = getTierLimits(quotaUser?.subscriptionTier);
    if (activeCopies >= maxCopyTrades) {
      throw new ForbiddenException(
        `Your plan allows ${maxCopyTrades} active bot subscription(s). Upgrade to add more.`,
      );
    }

    const billingModel =
      dto.billingModel ?? SubscriptionBillingModel.FIXED;
    const isProfitShare =
      billingModel === SubscriptionBillingModel.PROFIT_SHARE;
    const planType = dto.planType ?? 'MONTHLY';
    const isFree =
      listing.monthlyPrice <= 0 &&
      listing.annualPrice <= 0 &&
      listing.lifetimePrice <= 0;

    if (!isFree && !isProfitShare) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true },
      });
      if (!user || user.subscriptionTier === 'FREE') {
        throw new ForbiddenException(
          'Upgrade to PRO or higher to subscribe to paid bots',
        );
      }
    }

    if (isFree && !isProfitShare) {
      const subscription = await this.prisma.userStrategySubscription.upsert({
        where: { userId_strategyId: { userId, strategyId } },
        create: {
          userId,
          strategyId,
          brokerAccountId: broker.id,
          status: SubscriptionStatus.PROVISIONING,
          planType,
          subscribedAt: new Date(),
          riskOverrideEnabled: false,
          executionPriority: 0,
          lotMultiplier: 1,
          executionProfileJson: {
            sizingMode: 'MULTIPLIER',
            copyFactoryPending: true,
          },
        },
        update: {
          brokerAccountId: broker.id,
          status: SubscriptionStatus.PROVISIONING,
          planType,
          subscribedAt: new Date(),
          lotMultiplier: 1,
          executionProfileJson: {
            sizingMode: 'MULTIPLIER',
            copyFactoryPending: true,
          },
        },
      });
      await this.activationService.track(
        userId,
        ACTIVATION_EVENTS.FIRST_MARKETPLACE_SUB,
        { strategyId },
      );
      await this.provisioning.startProvisioning(
        subscription.id,
        userId,
        strategyId,
        listing.strategy.name,
      );
      await this.copyFactorySync.enqueueLinkSubscription(subscription.id);
      return {
        subscription,
        requiresPayment: false,
        provisioning: true,
        estimatedReadyMinutes: 5,
      };
    }

    if (
      !isProfitShare &&
      dto.useTrial &&
      listing.trialDays > 0 &&
      planType !== 'LIFETIME' &&
      !listing.strategy.masterBrokerAccountId
    ) {
      const trialEndsAt = new Date(
        Date.now() + listing.trialDays * 24 * 60 * 60 * 1000,
      );
      const subscription = await this.prisma.userStrategySubscription.upsert({
        where: { userId_strategyId: { userId, strategyId } },
        create: {
          userId,
          strategyId,
          brokerAccountId: broker.id,
          status: SubscriptionStatus.PROVISIONING,
          planType,
          trialEndsAt,
          subscribedAt: new Date(),
          riskOverrideEnabled: false,
          executionPriority: 0,
          lotMultiplier: 1,
          executionProfileJson: {
            sizingMode: 'MULTIPLIER',
            copyFactoryPending: true,
          },
        },
        update: {
          brokerAccountId: broker.id,
          status: SubscriptionStatus.PROVISIONING,
          planType,
          trialEndsAt,
          subscribedAt: new Date(),
          lotMultiplier: 1,
          executionProfileJson: {
            sizingMode: 'MULTIPLIER',
            copyFactoryPending: true,
          },
        },
      });
      await this.activationService.track(
        userId,
        ACTIVATION_EVENTS.FIRST_MARKETPLACE_SUB,
        { strategyId },
      );
      await this.provisioning.startProvisioning(
        subscription.id,
        userId,
        strategyId,
        listing.strategy.name,
      );
      await this.copyFactorySync.enqueueLinkSubscription(subscription.id);
      return {
        subscription,
        requiresPayment: false,
        trial: true,
        trialEndsAt,
        provisioning: true,
        estimatedReadyMinutes: 5,
      };
    }

    const profitShareUpfrontFee = Number(
      process.env.PROFIT_SHARE_UPFRONT_FEE_INR ??
        DEFAULT_PROFIT_SHARE_UPFRONT_FEE_INR,
    );
    const amount = isProfitShare
      ? profitShareUpfrontFee
      : planType === 'ANNUAL'
        ? listing.annualPrice
        : planType === 'LIFETIME'
          ? listing.lifetimePrice
          : listing.monthlyPrice;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid listing amount for selected plan');
    }

    const useRazorpay =
      (quotaUser?.country ?? 'IN').toUpperCase() === 'IN' ||
      process.env.MARKETPLACE_PAYMENT_PROVIDER === 'razorpay';

    if (useRazorpay) {
      const amountPaise = Math.round(amount * 100);
      const order = await this.paymentsService.createRazorpayOrder(
        userId,
        amountPaise,
        'INR',
        isProfitShare
          ? `ps_${strategyId.slice(0, 8)}`
          : `bot_${strategyId.slice(0, 8)}`,
        {
          type: 'marketplace_subscription',
          strategyId,
          planType,
          userId,
          billingModel,
          profitSharePct: String(DEFAULT_PROFIT_SHARE_PCT),
        },
      );
      return {
        requiresPayment: true,
        paymentProvider: 'razorpay',
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        razorpayKeyId: order.keyId,
        demo: order.demo ?? false,
      };
    }

    if (!this.stripe) {
      throw new BadRequestException(
        'Card checkout is not configured. Use INR/Razorpay or contact support.',
      );
    }

    const mode =
      isProfitShare || planType === 'LIFETIME' ? 'payment' : 'subscription';
    const session = await this.stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (process.env.STRIPE_CURRENCY || 'inr').toLowerCase(),
            product_data: {
              name: listing.strategy.name,
              description: isProfitShare
                ? `Profit-share wallet funding for ${listing.strategy.name}`
                : `${planType} access to ${listing.strategy.name}`,
            },
            unit_amount: Math.round(amount * 100),
            ...(isProfitShare || planType === 'LIFETIME'
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
        billingModel,
        profitSharePct: String(DEFAULT_PROFIT_SHARE_PCT),
      },
      customer_creation: 'always',
    });

    return {
      checkoutUrl: session.url,
      requiresPayment: true,
      paymentProvider: 'stripe',
    };
  }

  async updateSubscriptionRiskControls(
    strategyId: string,
    userId: string,
    dto: UpdateSubscriptionRiskDto,
  ) {
    const subscription = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const data: Prisma.UserStrategySubscriptionUpdateInput = {
      riskOverrideEnabled:
        dto.riskOverrideEnabled ?? subscription.riskOverrideEnabled,
      maxDrawdownPct:
        dto.maxDrawdownPct !== undefined
          ? dto.maxDrawdownPct
          : subscription.maxDrawdownPct,
      slippageBps:
        dto.slippageBps !== undefined
          ? dto.slippageBps
          : subscription.slippageBps,
      executionPriority:
        dto.executionPriority !== undefined
          ? dto.executionPriority
          : subscription.executionPriority,
      latencyLimitMs:
        dto.latencyLimitMs !== undefined
          ? dto.latencyLimitMs
          : subscription.latencyLimitMs,
      riskPolicyJson: {
        updatedAt: new Date().toISOString(),
        source: 'subscription-risk-api',
        maxDrawdownPct:
          dto.maxDrawdownPct !== undefined
            ? dto.maxDrawdownPct
            : subscription.maxDrawdownPct,
        excludedSymbols:
          dto.excludedSymbols !== undefined
            ? dto.excludedSymbols
            : subscription.excludedSymbolsJson,
        slippageBps:
          dto.slippageBps !== undefined
            ? dto.slippageBps
            : subscription.slippageBps,
        executionPriority:
          dto.executionPriority !== undefined
            ? dto.executionPriority
            : subscription.executionPriority,
        latencyLimitMs:
          dto.latencyLimitMs !== undefined
            ? dto.latencyLimitMs
            : subscription.latencyLimitMs,
      },
    };

    if (dto.excludedSymbols !== undefined) {
      data.excludedSymbolsJson =
        dto.excludedSymbols as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.userStrategySubscription.update({
      where: { id: subscription.id },
      data,
    });
  }

  async getSubscriptionRiskControls(strategyId: string, userId: string) {
    const subscription = await this.prisma.userStrategySubscription.findUnique({
      where: { userId_strategyId: { userId, strategyId } },
      select: {
        id: true,
        status: true,
        riskOverrideEnabled: true,
        maxDrawdownPct: true,
        excludedSymbolsJson: true,
        slippageBps: true,
        executionPriority: true,
        latencyLimitMs: true,
        lastLatencyMs: true,
        lastExecutionAt: true,
        riskPolicyJson: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async getFeatured() {
    return this.redis.cached('cache:mkt:featured', FEATURED_TTL, () =>
      this.computeFeatured(),
    );
  }

  private async computeFeatured() {
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
      throw new ForbiddenException(
        'Subscription required to review this strategy',
      );
    }

    const hasAccess =
      sub.status === 'ACTIVE' ||
      (sub.status === 'CANCELLED' &&
        sub.subscribedAt &&
        Date.now() - new Date(sub.subscribedAt).getTime() >
          7 * 24 * 60 * 60 * 1000);
    if (!hasAccess) {
      throw new ForbiddenException(
        'Only active/past subscribers can review this strategy',
      );
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

  async replyToReview(
    reviewId: string,
    creatorId: string,
    dto: ReplyReviewDto,
  ) {
    const review = await this.prisma.strategyReview.findUnique({
      where: { id: reviewId },
      include: { strategy: { select: { creatorId: true } } },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.strategy.creatorId !== creatorId) {
      throw new ForbiddenException(
        'Only strategy creator can reply to reviews',
      );
    }

    return this.prisma.strategyReview.update({
      where: { id: reviewId },
      data: { creatorReply: dto.replyText },
    });
  }
}
