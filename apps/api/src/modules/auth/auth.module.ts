import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisModule } from './redis.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      // We will sign payload and set dynamically in auth.service, but this acts as default.
      secret:
        process.env.JWT_ACCESS_SECRET ||
        'profytron_v1_access_96e8b2c4d1a5f6b7c8d9e0f1a2b3c4d5',
      signOptions: { expiresIn: '1h' },
    }),
    RedisModule,
    EmailModule,
    UsersModule, // Empty wrapper stub currently
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
