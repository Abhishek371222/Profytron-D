import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { TOTP } from 'otplib';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { appError, ErrorCode } from '../../common/errors';

@Injectable()
export class TwoFaService {
  private readonly logger = new Logger(TwoFaService.name);
  private totp: TOTP;

  constructor(private prisma: PrismaService) {
    this.totp = new TOTP({
      period: 30,
      digits: 6,
    });
  }

  async setupTwoFa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    });
    if (!user) appError(HttpStatus.NOT_FOUND, 'User not found', ErrorCode.USER_NOT_FOUND);
    if (user.twoFactorEnabled) {
      appError(HttpStatus.BAD_REQUEST, '2FA is already enabled', ErrorCode.VALIDATION_ERROR);
    }

    const secret = this.totp.generateSecret();
    const otpUri = this.totp.toURI({
      label: user.email,
      issuer: 'Profytron',
      secret,
    });
    const qrCodeDataUrl = await qrcode.toDataURL(otpUri);

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { qrCode: qrCodeDataUrl, secret, otpUri };
  }

  async verifyAndEnable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user?.twoFactorSecret) {
      appError(HttpStatus.BAD_REQUEST, '2FA setup not initiated', ErrorCode.VALIDATION_ERROR);
    }
    const isValid = await this.totp.verify(token, { secret: user.twoFactorSecret! });
    if (!isValid) {
      appError(HttpStatus.BAD_REQUEST, 'Invalid TOTP code', ErrorCode.OTP_INVALID);
    }

    const backupCodes = this.generateBackupCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorBackupCodes: backupCodes },
    });

    this.logger.log(`2FA enabled for user ${userId}`);
    return { success: true, backupCodes };
  }

  async disable(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true, twoFactorBackupCodes: true },
    });
    if (!user?.twoFactorEnabled) {
      appError(HttpStatus.BAD_REQUEST, '2FA is not enabled', ErrorCode.VALIDATION_ERROR);
    }

    const valid = await this.totp.verify(token, { secret: user.twoFactorSecret! });
    const backupCodes = (user.twoFactorBackupCodes as string[]) ?? [];
    const isBackup = backupCodes.includes(token);
    if (!valid && !isBackup) {
      appError(HttpStatus.BAD_REQUEST, 'Invalid TOTP or backup code', ErrorCode.OTP_INVALID);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: undefined, twoFactorBackupCodes: undefined },
    });

    this.logger.log(`2FA disabled for user ${userId}`);
    return { success: true };
  }

  async regenerateBackupCodes(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user?.twoFactorEnabled) {
      appError(HttpStatus.BAD_REQUEST, '2FA is not enabled', ErrorCode.VALIDATION_ERROR);
    }
    if (!(await this.totp.verify(token, { secret: user.twoFactorSecret! }))) {
      appError(HttpStatus.BAD_REQUEST, 'Invalid TOTP code', ErrorCode.OTP_INVALID);
    }

    const newBackupCodes = this.generateBackupCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: newBackupCodes },
    });

    return { backupCodes: newBackupCodes };
  }

  async verifyToken(secret: string, token: string): Promise<boolean> {
    return !!(await this.totp.verify(token, { secret }));
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
  }
}
