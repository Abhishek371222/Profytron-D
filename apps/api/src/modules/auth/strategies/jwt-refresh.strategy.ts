import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from '../redis.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private redisService: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_REFRESH_SECRET ??
        (() => {
          throw new Error('JWT_REFRESH_SECRET env var is required');
        })(),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    if (payload.jti) {
      const isBlacklisted = await this.redisService.exists(
        `auth:blacklist:${payload.jti}`,
      );
      if (isBlacklisted)
        throw new UnauthorizedException('Refresh token has been revoked');
    }
    const refreshToken = req.cookies?.refresh_token;
    return {
      id: payload.sub,
      userId: payload.sub,
      refreshToken,
      jti: payload.jti,
    };
  }
}
