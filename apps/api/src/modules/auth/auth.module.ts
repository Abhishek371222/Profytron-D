import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TwoFaService } from './twofa.service';
import { RedisModule } from './redis.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import { GrowthModule } from '../growth/growth.module';
import { AgentsModule } from '../agents/agents.module';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

// Register each OAuth strategy only when its credentials are present. The
// strategies throw in production if their keys are missing, so gating
// registration here lets the API boot with whichever providers are configured
// (e.g. Google login simply stays disabled until GOOGLE_CLIENT_ID/SECRET are
// set) instead of crashing the whole app on startup.
const oauthProviders = [
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [GoogleStrategy]
    : []),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? [GithubStrategy]
    : []),
];

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '1h', algorithm: 'HS256' },
      }),
    }),
    RedisModule,
    EmailModule,
    UsersModule,
    AffiliatesModule,
    GrowthModule,
    AgentsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TwoFaService,
    JwtStrategy,
    JwtRefreshStrategy,
    ...oauthProviders,
  ],
  exports: [AuthService, TwoFaService, JwtModule, PassportModule],
})
export class AuthModule {}
