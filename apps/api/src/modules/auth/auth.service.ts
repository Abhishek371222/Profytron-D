import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from './redis.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomUUID, randomInt } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  SupabaseLoginDto,
} from './dto/auth.dto';
import { TwoFaService } from './twofa.service';
import { appError, ErrorCode } from '../../common/errors';
import { AffiliatesService } from '../affiliates/affiliates.service';
import {
  ActivationService,
  ACTIVATION_EVENTS,
} from '../growth/activation.service';
import { AgentEventService } from '../agents/agent-event.service';
import { AGENT_EVENTS } from '../agents/agent.types';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private affiliatesService: AffiliatesService,
    private activationService: ActivationService,
    private agentEvents: AgentEventService,
    private twoFaService: TwoFaService,
    private notificationsService: NotificationsService,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      this.logger.warn(
        'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — Supabase auth flows disabled',
      );
      this.supabase = null as any;
    }
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
    if (existing)
      appError(
        HttpStatus.CONFLICT,
        'Email already registered',
        ErrorCode.EMAIL_ALREADY_REGISTERED,
      );

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
        appError(
          HttpStatus.CONFLICT,
          'Email already registered',
          ErrorCode.EMAIL_ALREADY_REGISTERED,
        );
      }
      throw error;
    }

    await this.prisma.affiliate
      .create({ data: { userId: user.id } })
      .catch(() => {});

    void this.agentEvents.emit({
      type: AGENT_EVENTS.USER_REGISTERED,
      entityType: 'user',
      entityId: user.id,
      userId: user.id,
      payload: { email: dto.email, plan: dto.plan },
      idempotencyKey: `registered:${user.id}`,
    });

    if (dto.referralCode) {
      await this.affiliatesService.processReferral(user.id, dto.referralCode);
    }

    if (dto.plan) {
      await this.redisService.set(`auth:plan:${dto.email}`, dto.plan, 86400);
    }

    // randomInt(min, max) is cryptographically secure (CSPRNG via OpenSSL).
    // Math.random() is NOT suitable for security-sensitive tokens.
    const otp = randomInt(100000, 1000000).toString();
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
    const attemptKey = `auth:otp:attempts:${dto.email}`;
    const attempts = parseInt(
      (await this.redisService.get(attemptKey)) ?? '0',
      10,
    );
    if (attempts >= 5) {
      // Too many bad guesses — invalidate the OTP to force re-issue
      await this.redisService.del(`auth:otp:${dto.email}`);
      await this.redisService.del(attemptKey);
      appError(
        HttpStatus.TOO_MANY_REQUESTS,
        'Too many attempts. Request a new OTP.',
        ErrorCode.RATE_LIMIT_EXCEEDED,
      );
    }

    const storedOtp = await this.redisService.get(`auth:otp:${dto.email}`);
    if (!storedOtp)
      appError(
        HttpStatus.BAD_REQUEST,
        'OTP expired. Request a new one.',
        ErrorCode.OTP_EXPIRED,
      );
    if (storedOtp !== dto.otp) {
      await this.redisService.set(attemptKey, String(attempts + 1), 10 * 60);
      appError(
        HttpStatus.BAD_REQUEST,
        'Invalid verification code',
        ErrorCode.OTP_INVALID,
      );
    }
    await this.redisService.del(attemptKey);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user)
      appError(
        HttpStatus.BAD_REQUEST,
        'User not found',
        ErrorCode.USER_NOT_FOUND,
      );

    await this.redisService.del(`auth:otp:${dto.email}`);
    const updatedUser = await this.prisma.user.update({
      where: { email: dto.email },
      data: { emailVerified: true },
    });

    // Fire-and-forget welcome email with paper-trading CTA
    this.emailService
      .sendWelcomeEmail(updatedUser.email, updatedUser.fullName)
      .catch(() => {});

    await this.activationService.track(
      updatedUser.id,
      ACTIVATION_EVENTS.FIRST_LOGIN,
    );

    let selectedPlan: string | null = null;
    const storedPlan = await this.redisService.get(`auth:plan:${dto.email}`);
    if (storedPlan) {
      selectedPlan = storedPlan;
      await this.redisService.del(`auth:plan:${dto.email}`);
      if (storedPlan !== 'free') {
        await this.startPlatformTrial(updatedUser.id, storedPlan);
      }
    }

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
      selectedPlan,
    };
  }

  /** 7-day platform trial for Starter/Pro signups — no payment required. */
  private async startPlatformTrial(userId: string, planSlug: string) {
    const slug = planSlug.toLowerCase();
    if (slug === 'free') return;

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { name: { equals: slug, mode: 'insensitive' } },
          { name: { contains: slug, mode: 'insensitive' } },
        ],
      },
    });
    if (!plan || plan.monthlyPrice <= 0) return;

    const existing = await this.prisma.userSubscription.findFirst({
      where: { userId },
    });
    if (existing) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        billingCycle: 'TRIAL',
        expiresAt,
        nextBillingAt: expiresAt,
      },
    });

    const tierBySlug: Record<
      string,
      'PRO' | 'ELITE' | 'BUSINESS' | 'INSTITUTIONAL'
    > = {
      starter: 'PRO',
      pro: 'ELITE',
      business: 'BUSINESS',
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: tierBySlug[slug] ?? 'PRO' },
    });
  }

  async login(dto: LoginDto, req: Request) {
    const failKey = `auth:fails:${dto.email.toLowerCase()}`;
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_SECONDS = 15 * 60;

    // Check lockout before any DB query to prevent timing-based enumeration
    try {
      const failCount = parseInt(
        (await this.redisService.get(failKey)) ?? '0',
        10,
      );
      if (failCount >= MAX_ATTEMPTS) {
        appError(
          HttpStatus.TOO_MANY_REQUESTS,
          'Too many failed attempts. Try again in 15 minutes.',
          ErrorCode.RATE_LIMIT_EXCEEDED,
        );
      }
    } catch {
      // Redis unavailable for fail-counter — allow the request to proceed
      this.logger.warn(
        `Redis unavailable for login fail-counter ${failKey}. Skipping lockout check.`,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always run bcrypt.compare regardless of whether the user exists so that
    // response time is indistinguishable between "no such user" and "wrong
    // password". Without this, an attacker can enumerate registered emails via
    // timing (missing users return ~0 ms; valid users return ~100 ms).
    const DUMMY_HASH =
      '$2b$12$invalidhashpaddingtomakethislooklikearealbcrypthash00000';
    const isMatch = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !user.passwordHash || !isMatch) {
      // Increment fail counter regardless of whether the user exists to prevent
      // non-existent-email addresses from bypassing rate limiting
      try {
        const current = parseInt(
          (await this.redisService.get(failKey)) ?? '0',
          10,
        );
        const next = current + 1;
        await this.redisService.set(failKey, String(next), LOCKOUT_SECONDS);
        if (user && next >= MAX_ATTEMPTS) {
          const hour = new Date().toISOString().slice(0, 13);
          void this.agentEvents.emit({
            type: AGENT_EVENTS.AUTH_LOGIN_FAILED_THRESHOLD,
            entityType: 'user',
            entityId: user.id,
            userId: user.id,
            payload: { failCount: next, ip: req.ip },
            idempotencyKey: `login-fail:${user.id}:${hour}`,
          });
        }
      } catch {
        // Non-critical
      }
      appError(
        HttpStatus.UNAUTHORIZED,
        'Invalid credentials',
        ErrorCode.INVALID_CREDENTIALS,
      );
    }
    if (user.isSuspended)
      appError(
        HttpStatus.FORBIDDEN,
        'Account suspended',
        ErrorCode.ACCOUNT_SUSPENDED,
      );
    if (!user.emailVerified)
      appError(
        HttpStatus.FORBIDDEN,
        'Please verify your email first',
        ErrorCode.EMAIL_NOT_VERIFIED,
      );

    // Clear fail counter on successful login
    try {
      await this.redisService.del(failKey);
    } catch {
      // Non-critical
    }

    const ip = req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // If 2FA is enabled, issue a short-lived challenge token instead of full
    // session tokens. The client must call POST /auth/2fa/complete-login with
    // the challenge token + TOTP/backup code to receive a real session.
    if (user.twoFactorEnabled) {
      const challengeToken = randomUUID();
      await this.redisService.set(
        `auth:2fa:challenge:${challengeToken}`,
        user.id,
        5 * 60,
      );
      return { requiresTwoFa: true as const, challengeToken };
    }

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
      void this.emailService.sendLoginEmail(user.email, user.fullName, {
        ip,
        device: userAgent,
        time: new Date().toUTCString(),
        userId: user.id,
      });
      void this.notificationsService.create({
        userId: user.id,
        title: 'New Login Detected',
        message: `New sign-in detected from ${ip}. If this wasn't you, secure your account immediately.`,
        type: 'INFO',
        category: 'SECURITY',
        priority: 'HIGH',
        actionUrl: '/settings/security',
        sendPush: true,
      });
    } catch (error) {
      this.logger.warn(
        `Login bookkeeping failed for user ${user.id}. Continuing with successful authentication.`,
      );
      this.logger.debug?.((error as Error).message);
    }

    return {
      requiresTwoFa: false as const,
      accessToken: tokens.accessToken,
      user: this.sanitizeUser(user),
      refreshTokenForCookie: tokens.refreshToken,
    };
  }

  async completeTwoFactorLogin(
    challengeToken: string,
    code: string,
    req: Request,
  ) {
    const userId = await this.redisService.getdel(
      `auth:2fa:challenge:${challengeToken}`,
    );
    if (!userId) {
      appError(
        HttpStatus.UNAUTHORIZED,
        'Invalid or expired 2FA challenge',
        ErrorCode.OTP_EXPIRED,
      );
    }

    const valid = await this.twoFaService.verifyForLogin(userId, code);
    if (!valid) {
      appError(
        HttpStatus.UNAUTHORIZED,
        'Invalid 2FA code',
        ErrorCode.OTP_INVALID,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      appError(
        HttpStatus.UNAUTHORIZED,
        'User not found',
        ErrorCode.USER_NOT_FOUND,
      );
    }

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
          eventType: 'LOGIN_2FA',
          userId: user.id,
          detailsJson: { ip, userAgent },
          triggeredBy: user.id,
          ipAddress: ip,
          userAgent,
        },
      });
    } catch {
      // Non-critical
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
    // The refresh JWT has already been verified (signature + expiry + blacklist)
    // by JwtRefreshGuard before reaching here; the Redis record is an extra
    // rotation/revocation guard. In dev we run an in-process Redis that is wiped
    // on every API restart, so without this carve-out each restart would force
    // every user to log in again ("session expired"). Behaviour:
    //   - record present  -> must match the presented token (rotation guard)
    //   - record missing   -> reject only when backed by a real persistent Redis
    // Production (REDIS_INMEMORY unset) keeps the original strict behaviour.
    const usingEphemeralRedis = process.env.REDIS_INMEMORY === 'true';
    if (stored ? stored !== refreshToken : !usingEphemeralRedis)
      appError(
        HttpStatus.UNAUTHORIZED,
        'Invalid refresh session',
        ErrorCode.INVALID_REFRESH_SESSION,
      );

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      appError(
        HttpStatus.UNAUTHORIZED,
        'User not found',
        ErrorCode.USER_NOT_FOUND,
      );

    // Do not rotate/issue tokens for a suspended account (parity with login).
    if (user.isSuspended)
      appError(
        HttpStatus.FORBIDDEN,
        'Account suspended',
        ErrorCode.ACCOUNT_SUSPENDED,
      );

    // Blacklist the consumed refresh token so it cannot be reused
    if (jti) {
      const refreshExpiry = this.parseExpirySeconds(
        process.env.JWT_REFRESH_EXPIRES,
        7 * 24 * 3600,
      );
      await this.redisService.set(
        `auth:blacklist:${jti}`,
        'true',
        refreshExpiry,
      );
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshTokenSafely(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshTokenForCookie: tokens.refreshToken,
      user: {
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
      },
    };
  }

  async logout(userId: string, jti: string) {
    await this.redisService.del(`auth:refresh:${userId}:default`);
    if (jti) {
      // Blacklist the access token JTI for its remaining lifetime so it cannot
      // be used after logout. Use the configured expiry so the blacklist entry
      // does not outlive the token (wasted memory) or expire before it (gap).
      const accessExpiry = this.parseExpirySeconds(
        process.env.JWT_ACCESS_EXPIRES,
        3600,
      );
      await this.redisService.set(
        `auth:blacklist:${jti}`,
        'true',
        accessExpiry,
      );
    }

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
    // Atomic GETDEL prevents concurrent requests from both consuming the same
    // reset token and overwriting each other's new password.
    const email = await this.redisService.getdel(`auth:reset:${token}`);
    if (!email)
      appError(
        HttpStatus.BAD_REQUEST,
        'Invalid or expired reset link',
        ErrorCode.INVALID_RESET_LINK,
      );

    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });
    if (!user)
      appError(
        HttpStatus.BAD_REQUEST,
        'User not found',
        ErrorCode.USER_NOT_FOUND,
      );

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { email: email },
      data: { passwordHash },
    });

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

    void this.notificationsService.create({
      userId: user.id,
      title: 'Password Changed',
      message:
        "Your account password was reset. If this wasn't you, contact support immediately.",
      type: 'WARNING',
      category: 'SECURITY',
      priority: 'HIGH',
      actionUrl: '/settings/security',
      sendEmail: true,
      sendPush: true,
    });

    return { success: true };
  }

  async resendOtp(email: string) {
    // Always return the same generic response to prevent registration-status
    // enumeration (an attacker could distinguish "has pending OTP" from "not registered").
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });
    if (!user || user.emailVerified) {
      return { success: true };
    }

    const existing = await this.redisService.get(`auth:otp:${email}`);
    if (existing) {
      return { success: true };
    }

    const otp = randomInt(100000, 1000000).toString();
    await this.redisService.set(`auth:otp:${email}`, otp, 600);
    await this.emailService.sendOtpEmail(email, otp);
    return { success: true };
  }

  async googleCallback(profile: any) {
    if (!profile.email)
      appError(
        HttpStatus.BAD_REQUEST,
        'Google account has no public email. Choose an account that shares an email address.',
        ErrorCode.VALIDATION_ERROR,
      );

    const fullName =
      profile.fullName?.trim() || profile.name?.trim() || 'Google User';
    const avatarUrl = profile.avatarUrl || profile.picture || null;

    this.logger.log(
      `Google OAuth callback for ${profile.email}. Profile: fullName="${fullName}", hasAvatar=${!!avatarUrl}`,
    );

    const user = await this.prisma.user.upsert({
      where: { email: profile.email },
      create: {
        email: profile.email,
        fullName,
        avatarUrl,
        googleId: profile.googleId ?? null,
        emailVerified: true,
        referralCode: randomUUID(),
      },
      update: {
        fullName: fullName || undefined,
        avatarUrl: avatarUrl || undefined,
        googleId: profile.googleId ?? undefined,
        emailVerified: true,
      },
    });

    this.logger.log(`Google user synced: ${user.id} (${user.email})`);

    const session = await this.issueSessionOrTwoFaChallenge(user);
    if (session.requiresTwoFa) {
      const oauthCode = await this.storeOAuthExchangePayload({
        challengeToken: session.challengeToken,
      });
      return {
        oauthCode,
        user: this.sanitizeUser(user),
        requiresTwoFa: true as const,
        challengeToken: session.challengeToken,
      };
    }

    const oauthCode = await this.storeOAuthExchangePayload({
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
    });

    void this.emailService.sendLoginEmail(user.email, user.fullName, {
      device: 'Google Sign-In',
      time: new Date().toUTCString(),
      userId: user.id,
    });
    void this.notificationsService.create({
      userId: user.id,
      title: 'New Sign-In via Google',
      message: 'You signed in to your Profytron account using Google.',
      type: 'INFO',
      category: 'SECURITY',
      priority: 'NORMAL',
      actionUrl: '/settings/security',
      sendPush: true,
    });

    return {
      oauthCode,
      user: this.sanitizeUser(user),
      refreshTokenForCookie: session.tokens.refreshToken,
    };
  }

  async exchangeOAuthCode(code: string): Promise<
    | {
        accessToken: string;
        refreshTokenForCookie?: string;
        user?: { role?: string; onboardingCompleted?: boolean };
      }
    | { requiresTwoFa: true; challengeToken: string }
  > {
    const stored = await this.redisService.getdel(`auth:oauth:code:${code}`);
    if (!stored) {
      appError(
        HttpStatus.UNAUTHORIZED,
        'Invalid or expired OAuth code',
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    // New payloads are JSON; fall back to the legacy plain-string format for any
    // codes minted just before this change (60s TTL means this is short-lived).
    let parsed: any;
    try {
      parsed = JSON.parse(stored);
    } catch {
      if (stored.startsWith('2fa:')) {
        return { requiresTwoFa: true, challengeToken: stored.slice(4) };
      }
      return { accessToken: stored };
    }

    if (parsed.challengeToken) {
      return { requiresTwoFa: true, challengeToken: parsed.challengeToken };
    }
    return {
      accessToken: parsed.accessToken,
      refreshTokenForCookie: parsed.refreshToken,
      user: {
        role: parsed.role,
        onboardingCompleted: parsed.onboardingCompleted,
      },
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
      appError(
        HttpStatus.UNAUTHORIZED,
        'Invalid Supabase token',
        ErrorCode.SUPABASE_AUTH_FAILED,
      );
    }

    if (data.user.email !== dto.email) {
      this.logger.error(
        `Email mismatch: Supabase=${data.user.email}, DTO=${dto.email}`,
      );
      appError(
        HttpStatus.UNAUTHORIZED,
        'Email mismatch',
        ErrorCode.EMAIL_MISMATCH,
      );
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
    const session = await this.issueSessionOrTwoFaChallenge(user);
    if (session.requiresTwoFa) {
      return {
        requiresTwoFa: true as const,
        challengeToken: session.challengeToken,
      };
    }

    return {
      accessToken: session.tokens.accessToken,
      user: this.sanitizeUser(user),
      refreshTokenForCookie: session.tokens.refreshToken,
    };
  }

  private async issueSessionOrTwoFaChallenge(user: {
    id: string;
    email: string;
    role: string;
    twoFactorEnabled?: boolean;
  }) {
    // OAuth/Supabase/magic-link paths reach here; block suspended accounts so
    // they cannot obtain a session via a non-password login (parity with login).
    const account = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { isSuspended: true },
    });
    if (account?.isSuspended)
      appError(
        HttpStatus.FORBIDDEN,
        'Account suspended',
        ErrorCode.ACCOUNT_SUSPENDED,
      );
    if (user.twoFactorEnabled) {
      const challengeToken = randomUUID();
      await this.redisService.set(
        `auth:2fa:challenge:${challengeToken}`,
        user.id,
        5 * 60,
      );
      return { requiresTwoFa: true as const, challengeToken };
    }
    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.persistRefreshTokenSafely(user.id, tokens.refreshToken);
    return { requiresTwoFa: false as const, tokens };
  }

  private async storeOAuthExchangePayload(
    payload:
      | { challengeToken: string }
      | {
          accessToken: string;
          refreshToken: string;
          role?: string;
          onboardingCompleted?: boolean;
        },
  ): Promise<string> {
    const oauthCode = randomUUID();
    await this.redisService.set(
      `auth:oauth:code:${oauthCode}`,
      JSON.stringify(payload),
      60,
    );
    return oauthCode;
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
    return {
      success: true,
      message: 'If this email exists, a login link was sent',
    };
  }

  async verifyMagicLink(token: string) {
    const userId = await this.redisService.get(`auth:magic:${token}`);
    if (!userId)
      appError(
        HttpStatus.BAD_REQUEST,
        'Invalid or expired magic link',
        ErrorCode.INVALID_RESET_LINK,
      );

    await this.redisService.del(`auth:magic:${token}`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      appError(
        HttpStatus.BAD_REQUEST,
        'User not found',
        ErrorCode.USER_NOT_FOUND,
      );
    if (user.isSuspended)
      appError(
        HttpStatus.FORBIDDEN,
        'Account suspended',
        ErrorCode.ACCOUNT_SUSPENDED,
      );

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, lastLoginAt: new Date() },
    });

    const session = await this.issueSessionOrTwoFaChallenge(user);
    if (session.requiresTwoFa) {
      return {
        requiresTwoFa: true as const,
        challengeToken: session.challengeToken,
        user: this.sanitizeUser(user),
      };
    }

    return {
      accessToken: session.tokens.accessToken,
      user: this.sanitizeUser(user),
      refreshTokenForCookie: session.tokens.refreshToken,
    };
  }

  async githubCallback(profile: {
    githubId: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  }) {
    if (!profile.email)
      appError(
        HttpStatus.BAD_REQUEST,
        'GitHub account has no public email. Enable email in GitHub settings.',
        ErrorCode.VALIDATION_ERROR,
      );

    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
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
        data: {
          avatarUrl: profile.avatarUrl || user.avatarUrl,
          emailVerified: true,
        },
      });
    }

    const session = await this.issueSessionOrTwoFaChallenge(user);
    if (session.requiresTwoFa) {
      const oauthCode = await this.storeOAuthExchangePayload({
        challengeToken: session.challengeToken,
      });
      return {
        oauthCode,
        user: this.sanitizeUser(user),
        requiresTwoFa: true as const,
        challengeToken: session.challengeToken,
      };
    }

    const oauthCode = await this.storeOAuthExchangePayload({
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
    });

    void this.emailService.sendLoginEmail(user.email, user.fullName, {
      device: 'GitHub Sign-In',
      time: new Date().toUTCString(),
      userId: user.id,
    });
    void this.notificationsService.create({
      userId: user.id,
      title: 'New Sign-In via GitHub',
      message: 'You signed in to your Profytron account using GitHub.',
      type: 'INFO',
      category: 'SECURITY',
      priority: 'NORMAL',
      actionUrl: '/settings/security',
      sendPush: true,
    });

    return {
      oauthCode,
      user: this.sanitizeUser(user),
      refreshTokenForCookie: session.tokens.refreshToken,
    };
  }

  public sanitizeUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
