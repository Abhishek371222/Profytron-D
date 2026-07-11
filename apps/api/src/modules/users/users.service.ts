import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';
import { EmailService } from '../email/email.service';
import {
  UpdateProfileDto,
  UpdateRiskProfileDto,
} from './dto/users.dto';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { Express } from 'express';
import {
  ActivationService,
  ACTIVATION_EVENTS,
} from '../growth/activation.service';
import { closeUserAccount } from '../auth/account-lifecycle';

const PASSWORD_RESET_OTP_TTL = 600;
const PASSWORD_RESET_VERIFIED_TTL = 300;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private supabase: any;
  /** Process-local OTP mirror so verify still works if Redis read is flaky. */
  private readonly deleteAccountOtps = new Map<
    string,
    { otp: string; expiresAt: number }
  >();
  private readonly passwordResetOtps = new Map<
    string,
    { otp: string; expiresAt: number }
  >();

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private activationService: ActivationService,
    private emailService: EmailService,
  ) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.supabase = url && key ? createClient(url, key) : null;
  }

  private normalizeOtp(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value).trim();
    }
    return '';
  }

  private normalizeEmail(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  private rememberDeleteOtp(userId: string, otp: string, ttlSeconds: number) {
    this.deleteAccountOtps.set(userId, {
      otp,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private readRememberedDeleteOtp(userId: string): string | null {
    const entry = this.deleteAccountOtps.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.deleteAccountOtps.delete(userId);
      return null;
    }
    return entry.otp;
  }

  private clearRememberedDeleteOtp(userId: string) {
    this.deleteAccountOtps.delete(userId);
  }

  private rememberPasswordResetOtp(
    userId: string,
    otp: string,
    ttlSeconds: number,
  ) {
    this.passwordResetOtps.set(userId, {
      otp,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private readRememberedPasswordResetOtp(userId: string): string | null {
    const entry = this.passwordResetOtps.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.passwordResetOtps.delete(userId);
      return null;
    }
    return entry.otp;
  }

  private clearRememberedPasswordResetOtp(userId: string) {
    this.passwordResetOtps.delete(userId);
  }

  private async assertAccountEmail(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        deletedAt: true,
        isActive: true,
      },
    });
    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('User not found');
    }
    if (this.normalizeEmail(user.email) !== this.normalizeEmail(email)) {
      throw new BadRequestException(
        'Email does not match your registered account email',
      );
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) {
      delete (user as any).passwordHash;
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, id: { not: userId } },
      });
      if (existing) throw new BadRequestException('Username is already taken');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        username: dto.username,
        country: dto.country,
        timezone: dto.timezone,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
      },
    });

    delete (user as any).passwordHash;
    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const ALLOWED_MIMES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const safeExt = ALLOWED_MIMES[file.mimetype];
    if (!safeExt) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, or GIF images are allowed',
      );
    }
    const filePath = `${userId}/${crypto.randomUUID()}.${safeExt}`;

    const { data, error } = await this.supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Avatar upload failed: ${error.message}`);
      throw new BadRequestException('Failed to upload avatar to storage');
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrlData.publicUrl },
    });

    return { avatarUrl: publicUrlData.publicUrl };
  }

  async updateRiskProfile(userId: string, dto: UpdateRiskProfileDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(
        'User account not found. Please sign in again.',
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        riskProfileJson: dto.riskProfileJson as Prisma.InputJsonValue,
        riskDnaScore: dto.riskDnaScore,
        onboardingCompleted: true,
      },
    });

    delete (user as any).passwordHash;
    delete (user as any).twoFactorSecret;
    delete (user as any).twoFactorBackupCodes;

    void this.activationService
      .track(userId, ACTIVATION_EVENTS.ONBOARDING_COMPLETED)
      .catch((err) =>
        this.logger.warn(
          `Activation track skipped for ${userId}: ${err?.message ?? err}`,
        ),
      );

    return user;
  }

  async getSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    try {
      await this.prisma.userSession.delete({
        where: { id: sessionId },
      });
      // We'd also ideally want to remove the specific refresh token related to this session from Redis
      // But Redis currently stores strings (userId: jti).
      // If sessionId was saved with JTI, we could sync it perfectly.
    } catch {
      // Ignore if doesn't exist
    }
    return { success: true };
  }

  async revokeAllOtherSessions(userId: string, currentJti: string) {
    // Current backend deletes all refresh tokens except the one with currentJti?
    // UserSession table currently doesn't map directly to JTI, but you could delete everything that doesn't match the current request IP/Device.
    // Simplifying this for now since RedisService lacks getActiveSessions
    return { success: true };
  }

  async requestPasswordResetOtp(userId: string, email: string) {
    const user = await this.assertAccountEmail(userId, email);
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password reset is not available for this account type',
      );
    }

    const otpKey = `auth:reset:otp:${userId}`;
    const existingRedis = this.normalizeOtp(
      await this.redisService.get(otpKey),
    );
    const existingMemory = this.normalizeOtp(
      this.readRememberedPasswordResetOtp(userId),
    );
    const otp =
      (existingRedis.length === 6 ? existingRedis : '') ||
      (existingMemory.length === 6 ? existingMemory : '') ||
      crypto.randomInt(100000, 1000000).toString();

    this.rememberPasswordResetOtp(userId, otp, PASSWORD_RESET_OTP_TTL);
    await this.redisService.set(otpKey, otp, PASSWORD_RESET_OTP_TTL);
    await this.redisService.del(`auth:reset:verified:${userId}`);

    await this.emailService.sendPasswordResetOtpEmail(user.email, otp, userId);
    this.logger.log(`Password-reset OTP sent to user ${userId}`);

    return { sent: true };
  }

  async verifyPasswordResetOtp(userId: string, email: string, otp: string) {
    await this.assertAccountEmail(userId, email);

    const provided = this.normalizeOtp(otp);
    const otpKey = `auth:reset:otp:${userId}`;
    const fromRedis = this.normalizeOtp(await this.redisService.get(otpKey));
    const fromMemory = this.normalizeOtp(
      this.readRememberedPasswordResetOtp(userId),
    );
    const storedOtp = fromRedis || fromMemory;

    if (!storedOtp) {
      throw new BadRequestException(
        'OTP expired or not requested. Please request a new code.',
      );
    }
    if (storedOtp !== provided) {
      this.logger.warn(
        `Password-reset OTP mismatch for user ${userId} (provided length=${provided.length}, stored length=${storedOtp.length})`,
      );
      throw new BadRequestException('Invalid OTP');
    }

    await this.redisService.del(otpKey);
    this.clearRememberedPasswordResetOtp(userId);
    await this.redisService.set(
      `auth:reset:verified:${userId}`,
      '1',
      PASSWORD_RESET_VERIFIED_TTL,
    );

    return { verified: true };
  }

  async confirmPasswordReset(
    userId: string,
    email: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const user = await this.assertAccountEmail(userId, email);
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password reset is not available for this account type',
      );
    }
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const verified = await this.redisService.get(
      `auth:reset:verified:${userId}`,
    );
    if (!verified) {
      throw new BadRequestException(
        'OTP verification required before resetting your password',
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await this.redisService.del(`auth:reset:verified:${userId}`);
    await this.redisService.del(`auth:reset:otp:${userId}`);
    this.clearRememberedPasswordResetOtp(userId);

    // Force re-login with the new password.
    await this.redisService.del(`auth:refresh:${userId}:default`);
    await this.prisma.userSession.deleteMany({ where: { userId } });

    await this.prisma.auditLog.create({
      data: {
        eventType: 'PASSWORD_RESET',
        userId,
        detailsJson: { email: user.email, source: 'settings' },
        triggeredBy: userId,
      },
    });

    await this.emailService.sendPasswordChangedEmail(user.email, userId);
    this.logger.log(`Password reset completed for user ${userId}`);

    return { success: true, requireReauth: true };
  }

  async getKycStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    });
    const documents = await this.prisma.kycDocument.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });
    return { kycStatus: user?.kycStatus ?? 'NOT_STARTED', documents };
  }

  async submitKycDocument(
    userId: string,
    docType: string,
    file: Express.Multer.File,
  ) {
    const ALLOWED_KYC_MIMES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };
    const safeExt = ALLOWED_KYC_MIMES[file.mimetype];
    if (!safeExt) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, or PDF documents are allowed for KYC',
      );
    }
    const safeDocType = docType.replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = `kyc/${userId}/${safeDocType}_${crypto.randomUUID()}.${safeExt}`;

    const { error } = await this.supabase.storage
      .from('kyc-documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`KYC upload failed: ${error.message}`);
      throw new BadRequestException('Failed to upload document');
    }

    const doc = await this.prisma.kycDocument.create({
      data: { userId, docType, storagePath: filePath, status: 'PENDING' },
    });

    // Set user KYC status to PENDING if not already verified
    await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'PENDING' },
    });

    this.logger.log(`KYC document submitted for user ${userId}: ${docType}`);
    return { success: true, documentId: doc.id, status: 'PENDING' };
  }

  async requestDeleteAccountOtp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, deletedAt: true, isActive: true },
    });
    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    const otpKey = `auth:delete:otp:${userId}`;
    const ttlSeconds = 600;

    // Reuse an unexpired OTP on resend/double-click so the email code still matches.
    const existingRedis = this.normalizeOtp(
      await this.redisService.get(otpKey),
    );
    const existingMemory = this.normalizeOtp(
      this.readRememberedDeleteOtp(userId),
    );
    const otp =
      (existingRedis.length === 6 ? existingRedis : '') ||
      (existingMemory.length === 6 ? existingMemory : '') ||
      crypto.randomInt(100000, 1000000).toString();

    this.rememberDeleteOtp(userId, otp, ttlSeconds);
    await this.redisService.set(otpKey, otp, ttlSeconds);
    // Clear any prior verification so OTP must be re-entered.
    await this.redisService.del(`auth:delete:verified:${userId}`);

    await this.emailService.sendOtpEmail(user.email, otp, userId);
    this.logger.log(`Delete-account OTP sent to user ${userId}`);

    return { sent: true };
  }

  async verifyDeleteAccountOtp(userId: string, otp: string) {
    const provided = this.normalizeOtp(otp);
    const otpKey = `auth:delete:otp:${userId}`;

    const fromRedis = this.normalizeOtp(await this.redisService.get(otpKey));
    const fromMemory = this.normalizeOtp(this.readRememberedDeleteOtp(userId));
    const storedOtp = fromRedis || fromMemory;

    if (!storedOtp) {
      throw new BadRequestException(
        'OTP expired or not requested. Please request a new code.',
      );
    }
    if (storedOtp !== provided) {
      this.logger.warn(
        `Delete-account OTP mismatch for user ${userId} (provided length=${provided.length}, stored length=${storedOtp.length})`,
      );
      throw new BadRequestException('Invalid OTP');
    }

    await this.redisService.del(otpKey);
    this.clearRememberedDeleteOtp(userId);
    // Short window to complete the final confirmation step.
    await this.redisService.set(`auth:delete:verified:${userId}`, '1', 300);

    return { verified: true };
  }

  async deleteAccount(userId: string, finalConfirm: boolean) {
    if (!finalConfirm) {
      throw new BadRequestException('Final confirmation is required');
    }

    const verified = await this.redisService.get(
      `auth:delete:verified:${userId}`,
    );
    if (!verified) {
      throw new BadRequestException(
        'OTP verification required before deleting your account',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft-delete: user cannot log in or re-register this email; admin retains access.
    await closeUserAccount(this.prisma, this.redisService, user);

    await this.redisService.del(`auth:delete:verified:${userId}`);
    await this.redisService.del(`auth:delete:otp:${userId}`);
    this.clearRememberedDeleteOtp(userId);
    await this.prisma.userSession.deleteMany({ where: { userId } });

    return { success: true };
  }
}
