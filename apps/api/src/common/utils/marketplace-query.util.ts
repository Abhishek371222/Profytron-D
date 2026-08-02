import type { RedisService } from '../../modules/auth/redis.service';

/**
 * Shared filter fields that mean the exact same thing on both the
 * `/marketplace` (MarketplaceListing-rooted) and `/strategies`
 * (Strategy-rooted) browse endpoints. Kept deliberately narrow — only
 * fields with identical semantics on both endpoints belong here.
 * `assetClass`/`timeframe` and price-range filtering are NOT included:
 * `/marketplace` filters price across three tiers (monthly/annual/lifetime)
 * while `/strategies` only checks `monthlyPrice`, so unifying those would
 * change one endpoint's existing behavior.
 */
export interface StrategyFilterInput {
  category?: string;
  riskLevel?: string;
  isVerified?: boolean;
  search?: string;
  /** Whether the text search should also match the creator's full name. */
  includeCreatorInSearch?: boolean;
}

/**
 * Builds the common category/riskLevel/isVerified/text-search portion of a
 * Prisma `where` clause against the `Strategy` model. Callers nest the
 * result under `strategy` when querying from `MarketplaceListing`, or spread
 * it directly when querying `Strategy` itself.
 */
export function buildStrategyWhereFragment(
  filters: StrategyFilterInput,
): Record<string, any> {
  const where: Record<string, any> = {};

  if (filters.category) where.category = filters.category;
  if (filters.riskLevel) where.riskLevel = filters.riskLevel;
  if (typeof filters.isVerified === 'boolean') {
    where.isVerified = filters.isVerified;
  }

  if (filters.search) {
    const or: Record<string, any>[] = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
    if (filters.includeCreatorInSearch) {
      or.push({
        creator: { fullName: { contains: filters.search, mode: 'insensitive' } },
      });
    }
    where.OR = or;
  }

  return where;
}

/** Average-rating aggregation shared by every marketplace/strategy listing view. */
export function computeAverageRating(
  reviews: Array<{ rating: number }>,
): { avgRating: number; reviewCount: number } {
  if (!reviews.length) return { avgRating: 0, reviewCount: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { avgRating: sum / reviews.length, reviewCount: reviews.length };
}

/**
 * Busts every cache namespace that can hold a stale copy of a strategy's
 * marketplace listing — used by every write path that changes a strategy's
 * publish state, verification, or listing/price so `/marketplace` and
 * `/strategies` (separate cache namespaces) go stale together, not one at a
 * time.
 */
export async function bustMarketplaceCaches(
  redis: RedisService,
  opts: { strategyId?: string } = {},
): Promise<void> {
  const tasks = [
    redis.del('cache:mkt:featured'),
    redis.delPrefix('cache:mkt:listings:'),
    redis.delPrefix('cache:strategies:'),
  ];
  if (opts.strategyId) {
    tasks.push(redis.delPrefix(`cache:mkt:analytics:${opts.strategyId}:`));
  }
  await Promise.all(tasks);
}
