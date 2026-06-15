import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const KEY_PREFIX = 'prfy_';
const BCRYPT_ROUNDS = 10;

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, name: string, scopes: string[]) {
    const rawKey = `${KEY_PREFIX}${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, BCRYPT_ROUNDS);
    const keyPrefix = rawKey.slice(0, 12);

    await this.prisma.apiKey.create({
      data: { userId, name, keyHash, keyPrefix, scopes },
    });

    // Return the full key only once — it cannot be retrieved again.
    return { key: rawKey, prefix: keyPrefix, name, scopes };
  }

  async list(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return keys;
  }

  async revoke(id: string, userId: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API key not found');
    if (key.userId !== userId) throw new ForbiddenException();

    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }

  async validate(rawKey: string) {
    if (!rawKey.startsWith(KEY_PREFIX)) throw new UnauthorizedException();

    const prefix = rawKey.slice(0, 12);
    const candidates = await this.prisma.apiKey.findMany({
      where: {
        keyPrefix: prefix,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { user: { select: { id: true, role: true, subscriptionTier: true } } },
    });

    for (const candidate of candidates) {
      const match = await bcrypt.compare(rawKey, candidate.keyHash);
      if (match) {
        // Update lastUsedAt without awaiting to keep the hot path fast.
        this.prisma.apiKey
          .update({ where: { id: candidate.id }, data: { lastUsedAt: new Date() } })
          .catch(() => undefined);
        return candidate.user;
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
