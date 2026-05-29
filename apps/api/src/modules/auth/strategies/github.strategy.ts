import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'missing-github-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'missing-github-client-secret',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        `${process.env.API_PUBLIC_URL || 'http://localhost:4000'}/v1/auth/github/callback`,
      scope: ['user:email'],
    });
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
