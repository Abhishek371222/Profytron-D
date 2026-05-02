import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        `${process.env.API_PUBLIC_URL || 'https://api.profytron.example'}/v1/auth/google/callback`,
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
      done(new UnauthorizedException('Google account has no public email'), false);
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
