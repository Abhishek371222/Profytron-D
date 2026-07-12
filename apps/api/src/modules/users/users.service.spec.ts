import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';
import { EmailService } from '../email/email.service';
import { ActivationService } from '../growth/activation.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService password reset', () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    userSession: { deleteMany: jest.Mock };
    auditLog: { create: jest.Mock };
  };
  let redis: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    delPrefix: jest.Mock;
  };
  let email: {
    sendPasswordResetOtpEmail: jest.Mock;
    sendPasswordChangedEmail: jest.Mock;
  };

  const userId = 'user-1';
  const emailAddress = 'trader@example.com';

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedBcrypt.hash.mockResolvedValue('$2b$12$newhash' as never);

    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: userId,
          email: emailAddress,
          passwordHash: '$2b$12$oldhash',
          deletedAt: null,
          isActive: true,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      userSession: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    redis = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(undefined),
      delPrefix: jest.fn().mockResolvedValue(undefined),
    };

    email = {
      sendPasswordResetOtpEmail: jest.fn().mockResolvedValue(true),
      sendPasswordChangedEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: EmailService, useValue: email },
        {
          provide: ActivationService,
          useValue: { track: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('allows the matching account email to request an OTP', async () => {
    const result = await service.requestPasswordResetOtp(userId, emailAddress);

    expect(result).toEqual({ sent: true });
    expect(email.sendPasswordResetOtpEmail).toHaveBeenCalledWith(
      emailAddress,
      expect.stringMatching(/^\d{6}$/),
      userId,
    );
    expect(redis.set).toHaveBeenCalledWith(
      `auth:reset:otp:${userId}`,
      expect.stringMatching(/^\d{6}$/),
      600,
    );
    expect(redis.del).toHaveBeenCalledWith(`auth:reset:verified:${userId}`);
  });

  it('rejects a different email for OTP request', async () => {
    await expect(
      service.requestPasswordResetOtp(userId, 'other@example.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(email.sendPasswordResetOtpEmail).not.toHaveBeenCalled();
  });

  it('rejects an incorrect OTP', async () => {
    redis.get.mockResolvedValue('123456');

    await expect(
      service.verifyPasswordResetOtp(userId, emailAddress, '000000'),
    ).rejects.toThrow('Invalid OTP');
  });

  it('rejects missing/expired OTP', async () => {
    redis.get.mockResolvedValue(null);

    await expect(
      service.verifyPasswordResetOtp(userId, emailAddress, '123456'),
    ).rejects.toThrow(/expired or not requested/i);
  });

  it('creates verified state after a correct OTP', async () => {
    redis.get.mockResolvedValue('654321');

    const result = await service.verifyPasswordResetOtp(
      userId,
      emailAddress,
      '654321',
    );

    expect(result).toEqual({ verified: true });
    expect(redis.del).toHaveBeenCalledWith(`auth:reset:otp:${userId}`);
    expect(redis.set).toHaveBeenCalledWith(
      `auth:reset:verified:${userId}`,
      '1',
      300,
    );
  });

  it('blocks password confirm before OTP verification', async () => {
    redis.get.mockResolvedValue(null);

    await expect(
      service.confirmPasswordReset(
        userId,
        emailAddress,
        'NewStr0ng!',
        'NewStr0ng!',
      ),
    ).rejects.toThrow(/OTP verification required/i);
  });

  it('requires matching password confirmation', async () => {
    redis.get.mockResolvedValue('1');

    await expect(
      service.confirmPasswordReset(
        userId,
        emailAddress,
        'NewStr0ng!',
        'Different1!',
      ),
    ).rejects.toThrow(/do not match/i);
  });

  it('updates password hash, consumes reset state, and revokes sessions', async () => {
    redis.get.mockImplementation(async (key: string) =>
      key === `auth:reset:verified:${userId}` ? '1' : null,
    );

    const result = await service.confirmPasswordReset(
      userId,
      emailAddress,
      'NewStr0ng!',
      'NewStr0ng!',
    );

    expect(result).toEqual({ success: true, requireReauth: true });
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('NewStr0ng!', 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { passwordHash: '$2b$12$newhash' },
    });
    expect(redis.del).toHaveBeenCalledWith(`auth:reset:verified:${userId}`);
    expect(redis.del).toHaveBeenCalledWith(`auth:reset:otp:${userId}`);
    expect(redis.delPrefix).toHaveBeenCalledWith(`auth:refresh:${userId}:`);
    expect(prisma.userSession.deleteMany).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(email.sendPasswordChangedEmail).toHaveBeenCalledWith(
      emailAddress,
      userId,
    );
  });

  it('does not allow OTP reuse after verification', async () => {
    redis.get
      .mockResolvedValueOnce('111222')
      .mockResolvedValueOnce(null);

    await service.verifyPasswordResetOtp(userId, emailAddress, '111222');
    expect(redis.del).toHaveBeenCalledWith(`auth:reset:otp:${userId}`);

    await expect(
      service.verifyPasswordResetOtp(userId, emailAddress, '111222'),
    ).rejects.toThrow(/expired or not requested/i);
  });
});
