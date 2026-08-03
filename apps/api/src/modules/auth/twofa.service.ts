import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { generateSecret, generateURI, verify } from 'otplib';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from './redis.service';
import { CryptoService } from '../../common/crypto.service';
import { appError, ErrorCode } from '../../common/errors';

const TOTP_ATTEMPT_KEY = (userId: string) => `auth:2fa:attempts:${userId}`;
const SETUP_SECRET_KEY = (userId: string) => `auth:2fa:setup:${userId}`;
const MAX_2FA_ATTEMPTS = 10;
const SETUP_SECRET_TTL = 600;

@Injectable()
export class TwoFaService {
  private readonly logger = new Logger(TwoFaService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private cryptoService: CryptoService,
  ) {}

  private async isTotpValid(secret: string, token: string): Promise<boolean> {
    const normalized = String(token ?? '').trim();
    if (!/^\d{6}$/.test(normalized)) return false;
    try {
      const result = await verify({ secret, token: normalized });
      return Boolean(result?.valid);
    } catch {
      return false;
    }
  }

  /** Prefer AES-GCM ciphertext at rest; accept legacy plaintext for migration. */
  private sealSecret(plaintext: string): string {
    return this.cryptoService.encrypt(plaintext);
  }

  private unsealSecret(stored: string): string {
    const trimmed = String(stored ?? '').trim();
    if (!trimmed) return trimmed;
    if (trimmed.startsWith('{')) {
      try {
        return this.cryptoService.decrypt(trimmed);
      } catch {
        // fall through — may still be legacy TOTP base32 that happens to look like JSON start
      }
    }
    return trimmed;
  }

  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
  }

  private sealBackupCodes(plainCodes: string[]): string[] {
    return plainCodes.map((code) => this.hashBackupCode(code));
  }

  private matchesBackupCode(
    stored: unknown,
    presented: string,
  ): { matched: boolean; remaining: string[] } {
    const codes = Array.isArray(stored)
      ? stored.map((c) => String(c))
      : [];
    const presentedUpper = presented.trim().toUpperCase();
    const presentedHash = this.hashBackupCode(presentedUpper);
    let matchedIndex = -1;
    for (let i = 0; i < codes.length; i++) {
      const entry = codes[i];
      const isHash = /^[a-f0-9]{64}$/i.test(entry);
      if (
        (isHash && entry.toLowerCase() === presentedHash) ||
        (!isHash && entry.toUpperCase() === presentedUpper)
      ) {
        matchedIndex = i;
        break;
      }
    }
    if (matchedIndex === -1) {
      return { matched: false, remaining: codes };
    }
    return {
      matched: true,
      remaining: codes.filter((_, i) => i !== matchedIndex),
    };
  }

  async setupTwoFa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    });
    if (!user)
      appError(
        HttpStatus.NOT_FOUND,
        'User not found',
        ErrorCode.USER_NOT_FOUND,
      );
    if (user.twoFactorEnabled) {
      appError(
        HttpStatus.BAD_REQUEST,
        '2FA is already enabled',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const secret = generateSecret();
    const otpUri = generateURI({
      issuer: 'Profytron',
      label: user.email,
      secret,
    });
    const qrCodeDataUrl = await qrcode.toDataURL(otpUri);

    // Keep the pending secret in Redis until the user verifies a TOTP code.
    await this.redisService.set(
      SETUP_SECRET_KEY(userId),
      secret,
      SETUP_SECRET_TTL,
    );

    return { qrCode: qrCodeDataUrl, secret, otpUri };
  }

  async cancelSetup(userId: string) {
    await this.redisService.del(SETUP_SECRET_KEY(userId));
    return { cancelled: true };
  }

  async verifyAndEnable(userId: string, token: string) {
    const pendingSecret = await this.redisService.get(SETUP_SECRET_KEY(userId));
    if (!pendingSecret) {
      appError(
        HttpStatus.BAD_REQUEST,
        '2FA setup not initiated or has expired',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    if (user?.twoFactorEnabled) {
      appError(
        HttpStatus.BAD_REQUEST,
        '2FA is already enabled',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const isValid = await this.isTotpValid(pendingSecret, token);
    if (!isValid) {
      appError(
        HttpStatus.BAD_REQUEST,
        'Invalid TOTP code',
        ErrorCode.OTP_INVALID,
      );
    }

    const backupCodes = this.generateBackupCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: this.sealSecret(pendingSecret),
        twoFactorBackupCodes: this.sealBackupCodes(backupCodes),
      },
    });
    await this.redisService.del(SETUP_SECRET_KEY(userId));

    this.logger.log(`2FA enabled for user ${userId}`);
    // Return plaintext backup codes once; hashed at rest thereafter.
    return { success: true, backupCodes };
  }

  async disable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });
    if (!user?.twoFactorEnabled) {
      appError(
        HttpStatus.BAD_REQUEST,
        '2FA is not enabled',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const secret = user.twoFactorSecret
      ? this.unsealSecret(user.twoFactorSecret)
      : '';
    const valid = secret ? await this.isTotpValid(secret, token) : false;
    const { matched: isBackup } = this.matchesBackupCode(
      user.twoFactorBackupCodes,
      token,
    );
    if (!valid && !isBackup) {
      appError(
        HttpStatus.BAD_REQUEST,
        'Invalid TOTP or backup code',
        ErrorCode.OTP_INVALID,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });
    await this.redisService.del(SETUP_SECRET_KEY(userId));

    this.logger.log(`2FA disabled for user ${userId}`);
    return { success: true };
  }

  async regenerateBackupCodes(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      appError(
        HttpStatus.BAD_REQUEST,
        '2FA is not enabled',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    const secret = this.unsealSecret(user.twoFactorSecret);
    if (!(await this.isTotpValid(secret, token))) {
      appError(
        HttpStatus.BAD_REQUEST,
        'Invalid TOTP code',
        ErrorCode.OTP_INVALID,
      );
    }

    const newBackupCodes = this.generateBackupCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: this.sealBackupCodes(newBackupCodes) },
    });

    return { backupCodes: newBackupCodes };
  }

  async verifyForLogin(userId: string, token: string): Promise<boolean> {
    const attemptKey = TOTP_ATTEMPT_KEY(userId);
    const attempts = parseInt(
      (await this.redisService.get(attemptKey)) ?? '0',
      10,
    );
    if (attempts >= MAX_2FA_ATTEMPTS) {
      appError(
        HttpStatus.TOO_MANY_REQUESTS,
        'Too many 2FA attempts. Try again later.',
        ErrorCode.RATE_LIMIT_EXCEEDED,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorBackupCodes: true },
    });
    if (!user?.twoFactorSecret) return false;

    const secret = this.unsealSecret(user.twoFactorSecret);
    const valid = await this.isTotpValid(secret, token);
    if (valid) {
      await this.redisService.del(attemptKey);
      return true;
    }

    const { matched, remaining } = this.matchesBackupCode(
      user.twoFactorBackupCodes,
      token,
    );
    if (matched) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorBackupCodes: remaining },
      });
      await this.redisService.del(attemptKey);
      return true;
    }

    await this.redisService.set(attemptKey, String(attempts + 1), 15 * 60);
    return false;
  }

  async verifyToken(secret: string, token: string): Promise<boolean> {
    return this.isTotpValid(secret, token);
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
  }
}
