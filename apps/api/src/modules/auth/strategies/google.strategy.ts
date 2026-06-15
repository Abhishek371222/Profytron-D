import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL =
      process.env.GOOGLE_CALLBACK_URL ||
      `${process.env.API_PUBLIC_URL || 'http://localhost:4000'}/v1/auth/google/callback`;

    if (!clientID || !clientSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in production',
        );
      }
      super({
        clientID: 'missing-google-client-id',
        clientSecret: 'missing-google-client-secret',
        callbackURL,
        scope: ['email', 'profile'],
      });
      this.logger.warn(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
      return;
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      done(
        new UnauthorizedException('Google account has no public email'),
        false,
      );
      return;
    }

    const user = {
      googleId: id,
      email,
      fullName: displayName,
      avatarUrl: photos[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
