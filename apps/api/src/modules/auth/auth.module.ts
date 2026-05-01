import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TwoFaService } from './twofa.service';
import { RedisModule } from './redis.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:
        process.env.JWT_ACCESS_SECRET ??
        (() => {
          throw new Error('JWT_ACCESS_SECRET env var is required');
        })(),
      signOptions: { expiresIn: '1h' },
    }),
    RedisModule,
    EmailModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TwoFaService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy, GithubStrategy],
  exports: [AuthService, TwoFaService, JwtModule, PassportModule],
})
export class AuthModule {}
