import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private redisService: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ||
        'profytron_v1_access_96e8b2c4d1a5f6b7c8d9e0f1a2b3c4d5',
    });
  }

  async validate(payload: any) {
    // Check if token is blacklisted
    if (payload.jti) {
      const isBlacklisted = await this.redisService.exists(
        `auth:blacklist:${payload.jti}`,
      );
      if (isBlacklisted)
        throw new UnauthorizedException('Token has been revoked');
    }

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
