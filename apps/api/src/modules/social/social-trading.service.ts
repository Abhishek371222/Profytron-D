import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SocialTradingService {
  private readonly logger = new Logger(SocialTradingService.name);

  constructor(private prisma: PrismaService) {}

  async createOrUpdateProfile(userId: string, bio?: string, headline?: string) {
    return this.prisma.traderProfile.upsert({
      where: { userId },
      create: { userId, bio, headline },
      update: { bio, headline },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.traderProfile.findUnique({
      where: { userId },
      include: { followers2: true, following2: true },
    });
  }

  async updateProfileStats(userId: string, stats: any) {
    return this.prisma.traderProfile.update({
      where: { userId },
      data: stats,
    });
  }

  async follow(followerId: string, followingId: string) {
    const existing = await this.prisma.socialFollow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) return existing;

    return this.prisma.socialFollow.create({
      data: { followerId, followingId },
    });
  }

  async unfollow(followerId: string, followingId: string) {
    return this.prisma.socialFollow.deleteMany({
      where: { followerId, followingId },
    });
  }

  async getFollowers(userId: string) {
    return this.prisma.socialFollow.findMany({
      where: { followingId: userId },
      include: { follower: true },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.socialFollow.findMany({
      where: { followerId: userId },
      include: { following: true },
    });
  }

  async addComment(tradeId: string, userId: string, profileId: string, content: string) {
    return this.prisma.socialComment.create({
      data: { tradeId, userId, profileId, content },
    });
  }

  async getTradeComments(tradeId: string) {
    return this.prisma.socialComment.findMany({
      where: { tradeId },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async likeComment(commentId: string) {
    return this.prisma.socialComment.update({
      where: { id: commentId },
      data: { likes: { increment: 1 } },
    });
  }

  async getTopTraders(limit = 10) {
    return this.prisma.traderProfile.findMany({
      where: { isVerified: true },
      orderBy: { totalPnl: 'desc' },
      take: limit,
    });
  }
}
