# PHASE 2: ENTERPRISE AUTHENTICATION SYSTEM

## Overview
Implement Fortune 500-grade authentication with MFA, device management, session security, and password hardening.

---

## IMPLEMENTATION

### 2.1 Multi-Factor Authentication (Enhanced)

Create `/apps/api/src/modules/auth/dto/mfa.dto.ts`:

```typescript
import { IsString, IsEmail, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';

export enum MfaMethod {
  TOTP = 'TOTP',
  EMAIL_OTP = 'EMAIL_OTP',
  SMS_OTP = 'SMS_OTP',
  BACKUP_CODES = 'BACKUP_CODES',
}

export class SetupMfaDto {
  @IsEnum(MfaMethod)
  method: MfaMethod;
}

export class VerifyMfaSetupDto {
  @IsEnum(MfaMethod)
  method: MfaMethod;

  @IsString()
  @MinLength(6)
  @MaxLength(16)
  code: string;
}

export class VerifyMfaChallengeDto {
  @IsString()
  @MaxLength(36)
  challengeToken: string;

  @IsString()
  @MinLength(6)
  @MaxLength(16)
  code: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  rememberDevice?: boolean;
}
```

Create `/apps/api/src/modules/auth/services/mfa.service.ts`:

```typescript
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../redis.service';
import { EmailService } from '../../email/email.service';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import { appError, ErrorCode } from '../../../common/errors';

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  // Setup TOTP MFA
  async setupTotp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      appError(HttpStatus.NOT_FOUND, 'User not found', ErrorCode.USER_NOT_FOUND);
    }

    const secret = authenticator.generateSecret();
    const otpUri = authenticator.keyuri(user.email, 'Profytron', secret);
    const qrCode = await qrcode.toDataURL(otpUri);

    // Store temp secret for verification
    await this.redisService.set(`mfa:totp:setup:${userId}`, secret, 600); // 10 min

    return { qrCode, secret, otpUri };
  }

  // Verify and enable TOTP
  async verifyAndEnableTotp(userId: string, token: string) {
    const secret = await this.redisService.get(`mfa:totp:setup:${userId}`);
    if (!secret) {
      appError(
        HttpStatus.BAD_REQUEST,
        'TOTP setup not initiated or expired',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const isValid = authenticator.check(token, secret);
    if (!isValid) {
      appError(HttpStatus.BAD_REQUEST, 'Invalid TOTP code', ErrorCode.OTP_INVALID);
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => this.hashBackupCode(code)),
    );

    // Update user with TOTP enabled
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaMethods: {
          create: {
            method: 'TOTP',
            secret: this.encryptSecret(secret),
            isEnabled: true,
            isVerified: true,
          },
        },
        mfaBackupCodes: hashedBackupCodes,
      },
    });

    // Clear temp setup secret
    await this.redisService.del(`mfa:totp:setup:${userId}`);

    this.logger.log(`TOTP MFA enabled for user ${userId}`);

    return {
      success: true,
      backupCodes, // Return plain codes once (user must save)
      message: 'Please save your backup codes in a secure location',
    };
  }

  // Setup Email OTP
  async setupEmailOtp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      appError(HttpStatus.NOT_FOUND, 'User not found', ErrorCode.USER_NOT_FOUND);
    }

    // Mark email MFA as pending verification
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaMethods: {
          create: {
            method: 'EMAIL_OTP',
            isEnabled: false,
            isVerified: false,
          },
        },
      },
    });

    // Send verification OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    await this.redisService.set(`mfa:email:${userId}`, otp, 600); // 10 min

    await this.emailService.sendMfaVerificationEmail(user.email, otp);

    this.logger.log(`Email OTP verification sent to ${user.email}`);

    return { success: true, message: 'Verification code sent to your email' };
  }

  // Verify email OTP and enable
  async verifyAndEnableEmailOtp(userId: string, otp: string) {
    const storedOtp = await this.redisService.get(`mfa:email:${userId}`);
    if (!storedOtp || storedOtp !== otp) {
      appError(HttpStatus.UNAUTHORIZED, 'Invalid OTP', ErrorCode.OTP_INVALID);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaMethods: {
          updateMany: {
            where: { method: 'EMAIL_OTP' },
            data: { isVerified: true, isEnabled: true },
          },
        },
      },
    });

    await this.redisService.del(`mfa:email:${userId}`);

    this.logger.log(`Email OTP MFA enabled for user ${userId}`);

    return { success: true };
  }

  // Disable MFA method
  async disableMfa(userId: string, method: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { mfaMethods: true },
    });

    if (!user) {
      appError(HttpStatus.NOT_FOUND, 'User not found', ErrorCode.USER_NOT_FOUND);
    }

    // Verify the code (TOTP or backup code)
    const mfaMethod = user.mfaMethods.find((m) => m.method === method && m.isEnabled);
    if (!mfaMethod) {
      appError(HttpStatus.BAD_REQUEST, 'MFA method not enabled', ErrorCode.VALIDATION_ERROR);
    }

    const isValid = await this.verifyMfaCode(user, method, code);
    if (!isValid) {
      appError(HttpStatus.UNAUTHORIZED, 'Invalid MFA code', ErrorCode.OTP_INVALID);
    }

    // Disable the method
    await this.prisma.mfaMethod.update({
      where: { id: mfaMethod.id },
      data: { isEnabled: false },
    });

    this.logger.log(`${method} MFA disabled for user ${userId}`);

    return { success: true };
  }

  // Get active MFA methods
  async getActiveMfaMethods(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        mfaMethods: {
          where: { isEnabled: true },
          select: {
            id: true,
            method: true,
            isVerified: true,
            createdAt: true,
          },
        },
      },
    });

    return user?.mfaMethods || [];
  }

  // Verify MFA code (supports multiple methods)
  async verifyMfaCode(user: any, method: string, code: string): Promise<boolean> {
    const mfaMethod = user.mfaMethods?.find((m: any) => m.method === method);
    if (!mfaMethod?.isEnabled) return false;

    switch (method) {
      case 'TOTP':
        const secret = this.decryptSecret(mfaMethod.secret);
        return authenticator.check(code, secret);

      case 'EMAIL_OTP':
        const storedOtp = await this.redisService.get(`mfa:email:challenge:${user.id}`);
        return storedOtp === code;

      case 'BACKUP_CODES':
        // Check if backup code matches any of the hashed codes
        const isMatch = await Promise.all(
          (user.mfaBackupCodes || []).map((hashedCode: string) =>
            this.compareBackupCode(code, hashedCode),
          ),
        );
        if (isMatch.some((m) => m)) {
          // Consume the used backup code (remove from list)
          const remainingCodes = user.mfaBackupCodes.filter(
            (hashed: string) => !this.compareBackupCode(code, hashed),
          );
          await this.prisma.user.update({
            where: { id: user.id },
            data: { mfaBackupCodes: remainingCodes },
          });
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  // Send email OTP for MFA challenge
  async sendEmailOtpChallenge(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      appError(HttpStatus.NOT_FOUND, 'User not found', ErrorCode.USER_NOT_FOUND);
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    await this.redisService.set(`mfa:email:challenge:${userId}`, otp, 300); // 5 min

    await this.emailService.sendMfaChallengeEmail(user.email, otp);

    return { success: true, message: 'Code sent to your email' };
  }

  // Private helpers
  private generateBackupCodes(count = 10): string[] {
    return Array.from({ length: count }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
  }

  private async hashBackupCode(code: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(code).digest('hex');
  }

  private async compareBackupCode(plain: string, hash: string): Promise<boolean> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(plain).digest('hex') === hash;
  }

  private encryptSecret(secret: string): string {
    // Use application cipher
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'fallback');
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptSecret(encrypted: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'fallback');
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

---

### 2.2 Device Management & Trusted Devices

Create `/apps/api/src/modules/auth/services/device.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

interface DeviceFingerprint {
  userAgent: string;
  ipAddress: string;
  deviceType: string;
  os: string;
  browser: string;
}

@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService) {}

  async registerDevice(
    userId: string,
    userAgent: string,
    ipAddress: string,
    name?: string,
  ) {
    const fingerprint = this.generateFingerprint(userAgent, ipAddress);
    const deviceId = crypto.randomUUID();

    const device = await this.prisma.trustedDevice.create({
      data: {
        userId,
        deviceId,
        name: name || this.parseDeviceName(userAgent),
        fingerprint,
        ipAddress,
        userAgent,
        lastUsedAt: new Date(),
      },
    });

    return device;
  }

  async markDeviceAsTrusted(userId: string, deviceId: string, trustedFor = 30) {
    return this.prisma.trustedDevice.update({
      where: { deviceId },
      data: {
        isTrusted: true,
        trustedUntil: new Date(Date.now() + trustedFor * 24 * 60 * 60 * 1000),
      },
    });
  }

  async isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean> {
    const device = await this.prisma.trustedDevice.findFirst({
      where: {
        userId,
        fingerprint,
        isTrusted: true,
        trustedUntil: { gt: new Date() },
      },
    });

    return !!device;
  }

  async getDevices(userId: string) {
    return this.prisma.trustedDevice.findMany({
      where: { userId },
      select: {
        deviceId: true,
        name: true,
        lastUsedAt: true,
        isTrusted: true,
        trustedUntil: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async removeDevice(userId: string, deviceId: string) {
    return this.prisma.trustedDevice.deleteMany({
      where: { userId, deviceId },
    });
  }

  private generateFingerprint(userAgent: string, ipAddress: string): string {
    const combined = `${userAgent}:${ipAddress}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  private parseDeviceName(userAgent: string): string {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const parts = [device.name, browser.name, os.name].filter(Boolean);
    return parts.join(' ') || 'Unknown Device';
  }
}
```

---

### 2.3 Session Security

Update Prisma schema to add session table:

```prisma
model Session {
  id String @id @default(uuid())
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  jti String @unique // JWT ID for blacklisting
  
  ipAddress String
  userAgent String
  
  expiresAt DateTime
  createdAt DateTime @default(now())
  lastActivityAt DateTime @default(now())
  
  isActive Boolean @default(true)
  
  @@index([userId])
  @@index([jti])
  @@index([expiresAt])
}

model TrustedDevice {
  id String @id @default(uuid())
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  deviceId String @unique
  name String
  fingerprint String
  ipAddress String
  userAgent String
  
  isTrusted Boolean @default(false)
  trustedUntil DateTime?
  
  lastUsedAt DateTime @default(now())
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([fingerprint])
  @@index([trustedUntil])
}

model MfaMethod {
  id String @id @default(uuid())
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  method String // TOTP, EMAIL_OTP, SMS_OTP, BACKUP_CODES
  secret String? // For TOTP (encrypted)
  
  isEnabled Boolean @default(false)
  isVerified Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
}
```

---

### 2.4 Password Security (Argon2id)

Update `/apps/api/src/modules/auth/auth.service.ts`:

```typescript
import * as argon2 from 'argon2';

export class AuthService {
  // Use Argon2id for hashing (more secure than bcrypt)
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65540, // 64 MB
      timeCost: 3,       // 3 iterations
      parallelism: 2,    // 2 parallel threads
    });
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch {
      return false;
    }
  }

  // Validate password strength
  validatePasswordStrength(password: string): {
    isStrong: boolean;
    feedback: string[];
  } {
    const feedback: string[] = [];
    
    if (password.length < 12) {
      feedback.push('At least 12 characters');
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push('At least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      feedback.push('At least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      feedback.push('At least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('At least one special character');
    }
    
    return {
      isStrong: feedback.length === 0,
      feedback,
    };
  }

  // Check if password was breached (using Have I Been Pwned API)
  async isPasswordBreached(password: string): Promise<boolean> {
    try {
      const sha1 = require('crypto').createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const hashes = await response.text();

      return hashes.split('\r\n').some((line) => {
        const [hash] = line.split(':');
        return hash === suffix;
      });
    } catch (error) {
      // If API fails, don't block (fail open)
      console.error('Password breach check failed:', error);
      return false;
    }
  }
}
```

---

## Summary

**Phase 2 Deliverables:**
- ✅ Multi-Method MFA (TOTP, Email OTP, Backup Codes)
- ✅ Device Management & Fingerprinting
- ✅ Session Security & Tracking
- ✅ Argon2id Password Hashing
- ✅ Password Strength Validation
- ✅ Breach Detection (Have I Been Pwned)
- ✅ Trusted Device Management

**Next: PHASE 3 — Security Headers**
