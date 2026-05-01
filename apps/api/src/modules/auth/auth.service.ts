import {
  Injectable,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from './redis.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  SupabaseLoginDto,
} from './dto/auth.dto';
import { appError, ErrorCode } from '../../common/errors';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  private parseExpirySeconds(
    value: string | undefined,
    fallbackSeconds: number,
  ): number {
    if (!value) {
      return fallbackSeconds;
    }

    const normalized = value.trim().toLowerCase();
    const direct = Number(normalized);
    if (Number.isFinite(direct) && direct > 0) {
      return direct;
    }

    const match = normalized.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return fallbackSeconds;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return amount * (multipliers[unit] ?? 1);
  }

  private async persistRefreshTokenSafely(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    try {
      await this.redisService.set(
        `auth:refresh:${userId}:default`,
        refreshToken,
        7 * 24 * 3600,
      );
    } catch (error) {
      this.logger.warn(
        `Refresh token cache write failed for user ${userId}. Continuing with access token only.`,
      );
      this.logger.debug(String(error));
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) appError(HttpStatus.CONFLICT, 'Email already registered', ErrorCode.EMAIL_ALREADY_REGISTERED);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          emailVerified: false,
          referralCode: randomUUID(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        appError(HttpStatus.CONFLICT, 'Email already registered', ErrorCode.EMAIL_ALREADY_REGISTERED);
      }
      throw error;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`auth:otp:${dto.email}`, otp, 600);
    await this.emailService.sendOtpEmail(dto.email, otp);

    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: 'USER_REGISTERED',
          userId: user.id,
          detailsJson: { email: dto.email },
          triggeredBy: user.id,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Registration audit logging failed for user ${user.id}. Continuing with successful registration.`,
      );
      this.logger.debug?.((error as Error).message);
    }

    const response: Record<string, unknown> = {
      success: true,
      message: 'Check your email for verification code',
    };

    // Local dev convenience: expose OTP in non-production to unblock testing.
    if (process.env.NODE_ENV !== 'production') {
      response.devOtp = otp;
    }

    return response;
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const storedOtp = await this.redisService.get(`auth:otp:${dto.email}`);
    if (!storedOtp)
      appError(HttpStatus.BAD_REQUEST, 'OTP expired. Request a new one.', ErrorCode.OTP_EXPIRED);
    if (storedOtp !== dto.otp)
      appError(HttpStatus.BAD_REQUEST, 'Invalid verification code', ErrorCode.OTP_INVALID);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) appError(HttpStatus.BAD_REQUEST, 'User not found', ErrorCode.USER_NOT_FOUND);

    await this.redisService.del(`auth:otp:${dto.email}`);
    const updatedUser = await this.prisma.user.update({
      where: { email: dto.email },
      data: { emailVerified: true },
    });

    // Fire-and-forget welcome email
    this.emailService.sendWelcomeEmail(updatedUser.email, updatedUser.fullName).catch(() => {});

    const tokens = await this.generateTokenPair(
      updatedUser.id,
      updatedUser.email,
      updatedUser.role,
    );
    await this.persistRefreshTokenSafely(updatedUser.id, tokens.refreshToken);

    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: 'EMAIL_VERIFIED',
          userId: user.id,
          detailsJson: { email: dto.email },
          triggeredBy: user.id,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Email verification audit logging failed for user ${user.id}. Continuing with successful verification.`,
      );
      this.logger.debug?.((error as Error).message);
    }

    return {
      accessToken: tokens.accessToken,
      user: this.sanitizeUser(updatedUser),
      refreshTokenForCookie: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto, req: Request) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash)
      appError(HttpStatus.UNAUTHORIZED, 'Invalid credentials', ErrorCode.INVALID_CREDENTIALS);
    if (user.isSuspended) appError(HttpStatus.FORBIDDEN, 'Account suspended', ErrorCode.ACCOUNT_SUSPENDED);
    if (!user.emailVerified)
      appError(HttpStatus.FORBIDDEN, 'Please verify your email first', ErrorCode.EMAIL_NOT_VERIFIED);

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) appError(HttpStatus.UNAUTHORIZED, 'Invalid credentials', ErrorCode.INVALID_CREDENTIALS);

    const ip = req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshTokenSafely(user.id, tokens.refreshToken);

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      await this.prisma.userSession.create({
        data: {
          userId: user.id,
          deviceId: 'default',
          ipAddress: ip,
          browser: userAgent,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          eventType: 'LOGIN',
          userId: user.id,
          detailsJson: { ip, userAgent },
          triggeredBy: user.id,
          ipAddress: ip,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Login bookkeeping failed for user ${user.id}. Continuing with successful authentication.`,
      );
      this.logger.debug?.((error as Error).message);
    }

    return {
      accessToken: tokens.accessToken,
      user: this.sanitizeUser(user),
      refreshTokenForCookie: tokens.refreshToken,
    };
  }

  async refresh(userId: string, refreshToken: string, jti: string) {
    const stored = await this.redisService.get(
      `auth:refresh:${userId}:default`,
    );
    if (!stored || stored !== refreshToken)
      appError(HttpStatus.UNAUTHORIZED, 'Invalid refresh session', ErrorCode.INVALID_REFRESH_SESSION);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) appError(HttpStatus.UNAUTHORIZED, 'User not found', ErrorCode.USER_NOT_FOUND);

    // Blacklist the consumed refresh token so it cannot be reused
    if (jti) {
      const refreshExpiry = this.parseExpirySeconds(
        process.env.JWT_REFRESH_EXPIRES,
        7 * 24 * 3600,
      );
      await this.redisService.set(`auth:blacklist:${jti}`, 'true', refreshExpiry);
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshTokenSafely(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshTokenForCookie: tokens.refreshToken,
    };
  }

  async logout(userId: string, jti: string) {
    await this.redisService.del(`auth:refresh:${userId}:default`);
    if (jti) await this.redisService.set(`auth:blacklist:${jti}`, 'true', 3600);

    await this.prisma.userSession.deleteMany({
      where: { userId, deviceId: 'default' },
    });
    await this.prisma.auditLog.create({
      data: {
        eventType: 'LOGOUT',
        userId,
        detailsJson: {},
        triggeredBy: userId,
      },
    });

    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = randomUUID();
      await this.redisService.set(`auth:reset:${resetToken}`, email, 3600);
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    }
    return {
      success: true,
      message: 'If this email exists, a reset link was sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const email = await this.redisService.get(`auth:reset:${token}`);
    if (!email) appError(HttpStatus.BAD_REQUEST, 'Invalid or expired reset link', ErrorCode.INVALID_RESET_LINK);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) appError(HttpStatus.BAD_REQUEST, 'User not found', ErrorCode.USER_NOT_FOUND);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { email }, data: { passwordHash } });
    await this.redisService.del(`auth:reset:${token}`);

    // Invalidate refresh tokens broadly for the user
    await this.redisService.del(`auth:refresh:${user.id}:default`);

    await this.prisma.auditLog.create({
      data: {
        eventType: 'PASSWORD_RESET',
        userId: user.id,
        detailsJson: { email },
        triggeredBy: user.id,
      },
    });

    return { success: true };
  }

  async resendOtp(email: string) {
    const existing = await this.redisService.get(`auth:otp:${email}`);
    if (existing)
      return {
        success: true,
        message: 'Please wait before requesting a new code',
      }; // Throttle logic simplified

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`auth:otp:${email}`, otp, 600);
    await this.emailService.sendOtpEmail(email, otp);
    return { success: true };
  }

  async googleCallback(profile: any) {
    const fullName =
      profile.fullName?.trim() || profile.name?.trim() || 'Google User';
    const avatarUrl = profile.avatarUrl || profile.picture || null;

    this.logger.log(
      `Google OAuth callback for ${profile.email}. Profile: fullName="${fullName}", hasAvatar=${!!avatarUrl}`,
    );

    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          fullName,
          avatarUrl,
          googleId: profile.googleId,
          emailVerified: true,
          referralCode: randomUUID(),
        },
      });
      this.logger.log(`New Google user created: ${user.id} (${user.email})`);
    } else {
      // Update existing user with latest profile info if available
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: fullName || user.fullName,
          avatarUrl: avatarUrl || user.avatarUrl,
          emailVerified: true,
        },
      });
      this.logger.log(
        `Existing Google user updated: ${user.id} (${user.email})`,
      );
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshTokenSafely(user.id, tokens.refreshToken);
    return {
      accessToken: tokens.accessToken,
      user: this.sanitizeUser(user),
      refreshTokenForCookie: tokens.refreshToken,
    };
  }

  async supabaseLogin(dto: SupabaseLoginDto) {
    this.logger.log(`Initiating Supabase sync for: ${dto.email}`);

    // 1. Verify token with Supabase
    const { data, error } = await this.supabase.auth.getUser(dto.token);

    if (error || !data.user) {
      this.logger.error(
        `Supabase verification failed for ${dto.email}: ${error?.message}`,
      );
      appError(HttpStatus.UNAUTHORIZED, 'Invalid Supabase token', ErrorCode.SUPABASE_AUTH_FAILED);
    }

    if (data.user.email !== dto.email) {
      this.logger.error(
        `Email mismatch: Supabase=${data.user.email}, DTO=${dto.email}`,
      );
      appError(HttpStatus.UNAUTHORIZED, 'Email mismatch', ErrorCode.EMAIL_MISMATCH);
    }

    // Ensure fullName has a meaningful default
    const fullName = dto.fullName?.trim() || 'User';

    this.logger.log(
      `Identity verified for ${dto.email}. Provider: ${dto.provider}. Profile: fullName="${fullName}", hasAvatar=${!!dto.avatarUrl}`,
    );

    // 2. Sync/create user with profile data
    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      create: {
        email: dto.email,
        fullName, // Use the ensured fullName
        avatarUrl: dto.avatarUrl || null,
        bio: dto.bio || null,
        emailVerified: true,
        referralCode: randomUUID(),
      },
      update: {
        fullName: fullName || undefined, // Update if we have a meaningful name
        avatarUrl: dto.avatarUrl || undefined,
        bio: dto.bio || undefined,
        emailVerified: true,
      },
    });

    this.logger.log(
      `User profile synced: ${user.id} (${user.email}) - fullName="${user.fullName}", provider=${dto.provider}`,
    );

    // 3. Issue local tokens
    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshTokenSafely(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: this.sanitizeUser(user),
      refreshTokenForCookie: tokens.refreshToken,
    };
  }

  private async generateTokenPair(userId: string, email: string, role: string) {
    const jti = randomUUID();
    const accessExpiresIn = this.parseExpirySeconds(
      process.env.JWT_ACCESS_EXPIRES,
      3600,
    );
    const refreshExpiresIn = this.parseExpirySeconds(
      process.env.JWT_REFRESH_EXPIRES,
      7 * 24 * 3600,
    );

    const accessToken = this.jwtService.sign(
      { sub: userId, email, role, jti },
      {
        expiresIn: accessExpiresIn,
        secret: process.env.JWT_ACCESS_SECRET,
      },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, jti },
      {
        expiresIn: refreshExpiresIn,
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );
    return { accessToken, refreshToken };
  }

  async sendMagicLink(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (user && !user.isSuspended) {
      const token = randomUUID();
      await this.redisService.set(`auth:magic:${token}`, user.id, 900); // 15 min
      const link = `${process.env.FRONTEND_URL}/auth/magic?token=${token}`;
      await this.emailService.sendMagicLinkEmail(email, user.fullName, link);
    }
    return { success: true, message: 'If this email exists, a login link was sent' };
  }

  async verifyMagicLink(token: string) {
    const userId = await this.redisService.get(`auth:magic:${token}`);
    if (!userId) appError(HttpStatus.BAD_REQUEST, 'Invalid or expired magic link', ErrorCode.INVALID_RESET_LINK);

    await this.redisService.del(`auth:magic:${token}`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) appError(HttpStatus.BAD_REQUEST, 'User not found', ErrorCode.USER_NOT_FOUND);
    if (user.isSuspended) appError(HttpStatus.FORBIDDEN, 'Account suspended', ErrorCode.ACCOUNT_SUSPENDED);

    await this.prisma.user.update({ where: { id: userId }, data: { emailVerified: true, lastLoginAt: new Date() } });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshTokenSafely(user.id, tokens.refreshToken);
    return { accessToken: tokens.accessToken, user: this.sanitizeUser(user), refreshTokenForCookie: tokens.refreshToken };
  }

  async githubCallback(profile: { githubId: string; email: string; fullName: string; avatarUrl: string | null }) {
    if (!profile.email) appError(HttpStatus.BAD_REQUEST, 'GitHub account has no public email. Enable email in GitHub settings.', ErrorCode.VALIDATION_ERROR);

    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          fullName: profile.fullName || 'GitHub User',
          avatarUrl: profile.avatarUrl,
          emailVerified: true,
          referralCode: randomUUID(),
        },
      });
      this.logger.log(`New GitHub user created: ${user.id}`);
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: profile.avatarUrl || user.avatarUrl, emailVerified: true },
      });
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshTokenSafely(user.id, tokens.refreshToken);
    return { accessToken: tokens.accessToken, user: this.sanitizeUser(user), refreshTokenForCookie: tokens.refreshToken };
  }

  public sanitizeUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
