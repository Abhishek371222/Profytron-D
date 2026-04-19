import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type SearchItemType = 'strategy' | 'marketplace' | 'creator' | 'page';

export interface GlobalSearchItem {
  id: string;
  type: SearchItemType;
  title: string;
  subtitle?: string;
  href: string;
  score: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(
    query: string,
    limit: number,
  ): Promise<GlobalSearchItem[]> {
    const q = query.trim();
    if (!q) {
      return this.getTrendingFallback(limit);
    }

    const [strategies, listings, creators] = await Promise.all([
      this.prisma.strategy.findMany({
        where: {
          isPublished: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          riskLevel: true,
          verificationStatus: true,
        },
        take: limit,
      }),
      this.prisma.marketplaceListing.findMany({
        where: {
          OR: [
            { strategy: { name: { contains: q, mode: 'insensitive' } } },
            { strategy: { description: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: {
          strategyId: true,
          strategy: {
            select: {
              name: true,
              category: true,
              riskLevel: true,
            },
          },
        },
        take: limit,
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          username: true,
          role: true,
        },
        take: limit,
      }),
    ]);

    const strategyItems: GlobalSearchItem[] = strategies.map((s) => ({
      id: s.id,
      type: 'strategy',
      title: s.name,
      subtitle: `${s.riskLevel} risk - ${s.verificationStatus}`,
      href: `/strategies/${s.id}`,
      score: 90,
    }));

    const marketplaceItems: GlobalSearchItem[] = listings.map((l) => ({
      id: l.strategyId,
      type: 'marketplace',
      title: l.strategy.name,
      subtitle: `Marketplace - ${l.strategy.category} - ${l.strategy.riskLevel}`,
      href: `/marketplace/${l.strategyId}`,
      score: 80,
    }));

    const creatorItems: GlobalSearchItem[] = creators.map((u) => ({
      id: u.id,
      type: 'creator',
      title: u.fullName,
      subtitle: `${u.role} ${u.username ? `- @${u.username}` : ''}`.trim(),
      href: '/community',
      score: 70,
    }));

    const pageItems: GlobalSearchItem[] = this.rankStaticPages(q);

    return [
      ...strategyItems,
      ...marketplaceItems,
      ...creatorItems,
      ...pageItems,
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit * 2);
  }

  private async getTrendingFallback(
    limit: number,
  ): Promise<GlobalSearchItem[]> {
    const trending = await this.prisma.strategy.findMany({
      where: { isPublished: true },
      orderBy: { copiesCount: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
      },
      take: limit,
    });

    return trending.map((s) => ({
      id: s.id,
      type: 'strategy',
      title: s.name,
      subtitle: `Trending - ${s.category}`,
      href: `/strategies/${s.id}`,
      score: 50,
    }));
  }

  private rankStaticPages(query: string): GlobalSearchItem[] {
    const pages = [
      {
        title: 'Dashboard',
        href: '/dashboard',
        keywords: ['dashboard', 'overview', 'home'],
      },
      {
        title: 'Strategy Builder',
        href: '/strategies/builder',
        keywords: ['builder', 'create', 'strategy'],
      },
      {
        title: 'Marketplace',
        href: '/marketplace',
        keywords: ['marketplace', 'buy', 'copy'],
      },
      {
        title: 'Analytics',
        href: '/analytics',
        keywords: ['analytics', 'performance', 'metrics'],
      },
      {
        title: 'Wallet',
        href: '/wallet',
        keywords: ['wallet', 'deposit', 'withdraw'],
      },
      {
        title: 'AI Coach',
        href: '/ai-coach',
        keywords: ['ai', 'coach', 'chat'],
      },
    ];

    const q = query.toLowerCase();
    const candidates = pages.map((p) => {
      const hit =
        p.keywords.some((k) => k.includes(q)) ||
        p.title.toLowerCase().includes(q);
      return hit
        ? {
            id: p.href,
            type: 'page' as const,
            title: p.title,
            subtitle: 'Navigate quickly',
            href: p.href,
            score: 60,
          }
        : null;
    });

    return candidates.filter((v): v is NonNullable<typeof v> => Boolean(v));
  }
}
