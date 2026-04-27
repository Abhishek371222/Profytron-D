import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from './redis.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService (UNIT TESTS)', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let emailService: EmailService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: '$2b$12$hashed',
    emailVerified: false,
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup bcrypt mock
    const hashedPasswords = new Map<string, string>();
    mockedBcrypt.hash.mockImplementation(async (plain, rounds) => {
      const hash = `$2b$${rounds}$abcdefghijklmnopqrstuvwx`;
      hashedPasswords.set(plain as string, hash);
      return hash;
    });
    mockedBcrypt.compare.mockImplementation(async (plain, hashed) => {
      return hashedPasswords.get(plain as string) === hashed;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            userSession: {
              create: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            exists: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendOtpEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwt-token-123'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('1. REGISTRATION', () => {
    it('should register a new user with valid email and password', async () => {
      const dto = {
        email: 'newuser@test.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
        fullName: 'New User',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: dto.email,
      });
      (redisService.set as jest.Mock).mockResolvedValue(true);

      const result = await authService.register(dto);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Check your email');
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).toHaveBeenCalled();
    });

    it('should reject registration if email already exists', async () => {
      const dto = {
        email: 'existing@test.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
        fullName: 'User',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.register(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should send OTP email during registration', async () => {
      const dto = {
        email: 'newuser@test.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
        fullName: 'New User',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: dto.email,
      });

      await authService.register(dto);

      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        dto.email,
        expect.any(String),
      );
    });

    it('should store OTP in Redis with 10-minute expiry', async () => {
      const dto = {
        email: 'newuser@test.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
        fullName: 'New User',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: dto.email,
      });

      await authService.register(dto);

      expect(redisService.set).toHaveBeenCalledWith(
        `auth:otp:${dto.email}`,
        expect.any(String),
        600,
      );
    });
  });

  describe('2. EMAIL VERIFICATION', () => {
    it('should verify email with correct OTP', async () => {
      const dto = { email: 'test@example.com', otp: '123456' };

      (redisService.get as jest.Mock).mockResolvedValue('123456');
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });

      const result = await authService.verifyEmail(dto);

      expect(result.user.emailVerified).toBe(true);
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should reject invalid OTP', async () => {
      const dto = { email: 'test@example.com', otp: 'wrong-otp' };

      (redisService.get as jest.Mock).mockResolvedValue('123456');

      await expect(authService.verifyEmail(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject expired OTP', async () => {
      const dto = { email: 'test@example.com', otp: '123456' };

      (redisService.get as jest.Mock).mockResolvedValue(null);

      await expect(authService.verifyEmail(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('3. JWT TOKEN GENERATION', () => {
    it('should generate valid JWT token on login', async () => {
      const loginDto = { email: 'test@example.com', password: 'Pass123!' };
      const req = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest-test' },
      } as Partial<Request> as Request;
      const hashedPassword = '$2b$12$abcdefghijklmnopqrstuvwx';

      // Mock bcrypt.compare for this specific test
      (mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
        emailVerified: true,
      });

      const tokens = await authService.login(loginDto, req);

      expect(tokens.accessToken).toBeDefined();
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should include user ID in JWT payload', async () => {
      const loginDto = { email: 'test@example.com', password: 'Pass123!' };
      const req = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest-test' },
      } as Partial<Request> as Request;

      // Mock bcrypt.compare for this specific test
      (mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: mockUser.passwordHash,
        emailVerified: true,
      });

      await authService.login(loginDto, req);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          jti: expect.any(String),
        }),
        expect.any(Object),
      );
    });
  });

  describe('4. PASSWORD HASHING', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'SecurePassword123!';
      const hashed = await bcrypt.hash(password, 12);

      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(20);
    });

    it('should verify correct password against hash', async () => {
      const password = 'SecurePassword123!';
      const hashed = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hashed);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const hashed = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare('WrongPassword', hashed);

      expect(isValid).toBe(false);
    });
  });
});
