import type { PrismaService } from '../../prisma/prisma.service';
import type { RedisService } from '../auth/redis.service';
import { Prisma } from '@prisma/client';

export function isClosedAccount(user: {
  deletedAt?: Date | null;
  isActive?: boolean | null;
}): boolean {
  return Boolean(user.deletedAt) || user.isActive === false;
}

/**
 * Soft-close an account for the end user while keeping the record for admin.
 * - Original email is KEPT so it cannot be re-registered
 * - Login credentials / sessions are revoked
 * - Admin can still view the row and operate on wallet/data
 */
export async function closeUserAccount(
  prisma: PrismaService,
  redis: RedisService,
  user: { id: string; email: string },
): Promise<void> {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      // Keep email unique & reserved — do not free it for new signups.
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

/** @deprecated Use closeUserAccount — email is no longer released. */
export const releaseClosedAccountIdentity = closeUserAccount;
