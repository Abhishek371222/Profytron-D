import { Test, TestingModule } from '@nestjs/testing';
import { generate, generateSecret } from 'otplib';
import { TwoFaService } from './twofa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from './redis.service';
import { HttpException } from '@nestjs/common';

describe('TwoFaService', () => {
  let service: TwoFaService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
  };
  let redis: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };

  const userId = 'user-2fa';
  const email = 'trader@example.com';

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    redis = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFaService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(TwoFaService);
  });

  it('setup returns a secret and valid QR data URL, storing pending secret in Redis', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email,
      twoFactorEnabled: false,
    });

    const result = await service.setupTwoFa(userId);

    expect(result.secret).toMatch(/^[A-Z2-7]+$/i);
    expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(result.otpUri).toMatch(/^otpauth:\/\/totp\//);
    expect(redis.set).toHaveBeenCalledWith(
      `auth:2fa:setup:${userId}`,
      result.secret,
      600,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('enables 2FA with a valid authenticator code from pending Redis secret', async () => {
    const secret = generateSecret();
    const token = await generate({ secret });
    redis.get.mockResolvedValue(secret);
    prisma.user.findUnique.mockResolvedValue({ twoFactorEnabled: false });

    const result = await service.verifyAndEnable(userId, token);

    expect(result.success).toBe(true);
    expect(result.backupCodes).toHaveLength(10);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: result.backupCodes,
      },
    });
    expect(redis.del).toHaveBeenCalledWith(`auth:2fa:setup:${userId}`);
  });

  it('rejects an invalid authenticator code and does not enable 2FA', async () => {
    const secret = generateSecret();
    redis.get.mockResolvedValue(secret);
    prisma.user.findUnique.mockResolvedValue({ twoFactorEnabled: false });

    await expect(
      service.verifyAndEnable(userId, '000000'),
    ).rejects.toBeInstanceOf(HttpException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('verifyToken reads the otplib v13 result.valid field correctly', async () => {
    const secret = generateSecret();
    const token = await generate({ secret });

    await expect(service.verifyToken(secret, token)).resolves.toBe(true);
    await expect(service.verifyToken(secret, '111111')).resolves.toBe(false);
  });

  it('login verification accepts valid TOTP and rejects invalid TOTP', async () => {
    const secret = generateSecret();
    const token = await generate({ secret });
    prisma.user.findUnique.mockResolvedValue({
      twoFactorSecret: secret,
      twoFactorBackupCodes: [],
    });
    redis.get.mockResolvedValue('0');

    await expect(service.verifyForLogin(userId, token)).resolves.toBe(true);
    await expect(service.verifyForLogin(userId, '000000')).resolves.toBe(false);
  });

  it('consumes backup codes as single-use', async () => {
    prisma.user.findUnique.mockResolvedValue({
      twoFactorSecret: generateSecret(),
      twoFactorBackupCodes: ['ABCD1234'],
    });
    redis.get.mockResolvedValue('0');

    await expect(service.verifyForLogin(userId, 'ABCD1234')).resolves.toBe(
      true,
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { twoFactorBackupCodes: [] },
    });
  });

  it('disabling 2FA clears secret and backup codes', async () => {
    const secret = generateSecret();
    const token = await generate({ secret });
    prisma.user.findUnique.mockResolvedValue({
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: ['CODE1'],
    });

    await expect(service.disable(userId, token)).resolves.toEqual({
      success: true,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });
  });

  it('cancelSetup deletes the pending Redis secret', async () => {
    await expect(service.cancelSetup(userId)).resolves.toEqual({
      cancelled: true,
    });
    expect(redis.del).toHaveBeenCalledWith(`auth:2fa:setup:${userId}`);
  });

  it('verifyAndEnable fails when pending setup is missing/expired', async () => {
    redis.get.mockResolvedValue(null);

    await expect(
      service.verifyAndEnable(userId, '123456'),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
