import type { PrismaService } from '../../prisma/prisma.service';
import type { RedisService } from '../auth/redis.service';
import { Prisma } from '@prisma/client';

export function isClosedAccount(user: {
  deletedAt?: Date | null;
  isActive?: boolean | null;
}): boolean {
  return Boolean(user.deletedAt) || user.isActive === false;
}

export async function closeUserAccount(
  prisma: PrismaService,
  redis: RedisService,
  user: { id: string; email: string },
): Promise<void> {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: null,
      isActive: false,
      deletedAt: new Date(),
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: Prisma.DbNull,
    },
  });
  await redis.del(`auth:userstate:${user.id}`);
  await redis.delPrefix(`auth:refresh:${user.id}:`);
  await prisma.userSession.deleteMany({ where: { userId: user.id } });
}

export const releaseClosedAccountIdentity = closeUserAccount;
