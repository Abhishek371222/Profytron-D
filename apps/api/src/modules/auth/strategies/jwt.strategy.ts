import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../redis.service';
import { PrismaService } from '../../../prisma/prisma.service';

/** How long a live user-state lookup is cached (seconds). Short enough that a
 * suspension/role change takes effect within seconds, long enough to avoid a DB
 * read on every authenticated request. */
const USER_STATE_TTL_SECONDS = 30;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ??
        (() => {
          throw new Error('JWT_ACCESS_SECRET env var is required');
        })(),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    if (payload.jti) {
      // Always check the blacklist — never cache a "this token is valid" result.
      // A positive cache would allow revoked tokens (logout, password-reset) to
      // remain usable until the cache TTL expired, defeating token revocation.
      const isBlacklisted = await this.redisService.exists(
        `auth:blacklist:${payload.jti}`,
      );
      if (isBlacklisted)
        throw new UnauthorizedException('Token has been revoked');
    }

    // Re-validate live user state (role/suspension/deletion) rather than
    // trusting the ~1h-stale token claims. Cached briefly so a suspended or
    // demoted user loses access within seconds — not on token expiry.
    const state = await this.getUserState(payload.sub);
    if (!state || !state.isActive || state.isSuspended || state.deletedAt) {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: state.role, // authoritative, from DB (not the token)
      jti: payload.jti,
    };
  }

  private async getUserState(userId: string): Promise<{
    role: string;
    isActive: boolean;
    isSuspended: boolean;
    deletedAt: boolean;
  } | null> {
    const cacheKey = `auth:userstate:${userId}`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      /* cache miss / parse error → fall through to DB */
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        isActive: true,
        isSuspended: true,
        deletedAt: true,
      },
    });
    if (!user) return null;

    const state = {
      role: user.role,
      isActive: user.isActive,
      isSuspended: user.isSuspended,
      deletedAt: Boolean(user.deletedAt),
    };
    try {
      await this.redisService.set(
        cacheKey,
        JSON.stringify(state),
        USER_STATE_TTL_SECONDS,
      );
    } catch {
      /* non-fatal: proceed without caching */
    }
    return state;
  }
}
