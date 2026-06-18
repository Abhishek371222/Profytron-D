import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

  constructor() {
    const clientID = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const callbackURL =
      process.env.GITHUB_CALLBACK_URL ||
      `${process.env.API_PUBLIC_URL || 'http://localhost:4000'}/v1/auth/github/callback`;

    if (!clientID || !clientSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required in production',
        );
      }
      super({
        clientID: 'missing-github-client-id',
        clientSecret: 'missing-github-client-secret',
        callbackURL,
        scope: ['user:email'],
      } as any);
      this.logger.warn(
        'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.',
      );
      return;
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
    } as any);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<any> {
    const primaryEmail =
      profile.emails?.find((e: any) => e.primary)?.value ??
      profile.emails?.[0]?.value;

    return {
      githubId: profile.id,
      email: primaryEmail,
      fullName: profile.displayName || profile.username,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };
  }
}
