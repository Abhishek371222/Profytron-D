import { Injectable, ConflictException, UnauthorizedException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from './redis.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RegisterDto, LoginDto, VerifyEmailDto, SupabaseLoginDto } from './dto/auth.dto';

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
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        emailVerified: false,
        referralCode: uuidv4(),
      },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`auth:otp:${dto.email}`, otp, 600);
    await this.emailService.sendOtpEmail(dto.email, otp);

    await this.prisma.auditLog.create({
      data: {
        eventType: 'USER_REGISTERED',
        userId: user.id,
        detailsJson: { email: dto.email },
        triggeredBy: user.id,
      },
    });

    return { success: true, message: 'Check your email for verification code' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const storedOtp = await this.redisService.get(`auth:otp:${dto.email}`);
    if (!storedOtp) throw new BadRequestException('OTP expired. Request a new one.');
    if (storedOtp !== dto.otp) throw new BadRequestException('Invalid verification code');

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('User not found');

    await this.redisService.del(`auth:otp:${dto.email}`);
    const updatedUser = await this.prisma.user.update({
      where: { email: dto.email },
      data: { emailVerified: true },
    });

    const tokens = await this.generateTokenPair(updatedUser.id, updatedUser.email, updatedUser.role);
    await this.redisService.set(`auth:refresh:${updatedUser.id}:default`, tokens.refreshToken, 7 * 24 * 3600);

    await this.prisma.auditLog.create({
      data: {
        eventType: 'EMAIL_VERIFIED',
        userId: user.id,
        detailsJson: { email: dto.email },
        triggeredBy: user.id,
      },
    });

    return { accessToken: tokens.accessToken, user: this.sanitizeUser(updatedUser), refreshTokenForCookie: tokens.refreshToken };
  }

  async login(dto: LoginDto, req: any) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (user.isSuspended) throw new ForbiddenException('Account suspended');
    if (!user.emailVerified) throw new ForbiddenException('Please verify your email first');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const ip = req?.ip || '0.0.0.0';
    const userAgent = req?.headers['user-agent'] || 'Unknown';

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.prisma.userSession.create({
      data: { userId: user.id, deviceId: 'default', ipAddress: ip, browser: userAgent },
    });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.redisService.set(`auth:refresh:${user.id}:default`, tokens.refreshToken, 7 * 24 * 3600);

    await this.prisma.auditLog.create({
      data: { eventType: 'LOGIN', userId: user.id, detailsJson: { ip, userAgent }, triggeredBy: user.id, ipAddress: ip, userAgent },
    });

    return { accessToken: tokens.accessToken, user: this.sanitizeUser(user), refreshTokenForCookie: tokens.refreshToken };
  }

  async refresh(userId: string, refreshToken: string, jti: string) {
    const stored = await this.redisService.get(`auth:refresh:${userId}:default`);
    if (!stored || stored !== refreshToken) throw new UnauthorizedException('Invalid refresh session');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.redisService.set(`auth:refresh:${user.id}:default`, tokens.refreshToken, 7 * 24 * 3600);

    return { accessToken: tokens.accessToken, refreshTokenForCookie: tokens.refreshToken };
  }

  async logout(userId: string, jti: string) {
    await this.redisService.del(`auth:refresh:${userId}:default`);
    if (jti) await this.redisService.set(`auth:blacklist:${jti}`, 'true', 3600);

    await this.prisma.userSession.deleteMany({ where: { userId, deviceId: 'default' } });
    await this.prisma.auditLog.create({
      data: { eventType: 'LOGOUT', userId, detailsJson: {}, triggeredBy: userId },
    });

    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = uuidv4();
      await this.redisService.set(`auth:reset:${resetToken}`, email, 3600);
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    }
    return { success: true, message: 'If this email exists, a reset link was sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const email = await this.redisService.get(`auth:reset:${token}`);
    if (!email) throw new BadRequestException('Invalid or expired reset link');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { email }, data: { passwordHash } });
    await this.redisService.del(`auth:reset:${token}`);
    
    // Invalidate refresh tokens broadly for the user
    await this.redisService.del(`auth:refresh:${user.id}:default`);

    await this.prisma.auditLog.create({
      data: { eventType: 'PASSWORD_RESET', userId: user.id, detailsJson: { email }, triggeredBy: user.id },
    });

    return { success: true };
  }

  async resendOtp(email: string) {
    const existing = await this.redisService.get(`auth:otp:${email}`);
    if (existing) return { success: true, message: 'Please wait before requesting a new code' }; // Throttle logic simplified

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(`auth:otp:${email}`, otp, 600);
    await this.emailService.sendOtpEmail(email, otp);
    return { success: true };
  }

  async googleCallback(profile: any) {
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          fullName: profile.fullName || 'Google User',
          avatarUrl: profile.avatarUrl,
          googleId: profile.googleId,
          emailVerified: true,
          referralCode: uuidv4(),
        },
      });
    }
    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.redisService.set(`auth:refresh:${user.id}:default`, tokens.refreshToken, 7 * 24 * 3600);
    return { accessToken: tokens.accessToken, user: this.sanitizeUser(user), refreshTokenForCookie: tokens.refreshToken };
  }

  async supabaseLogin(dto: SupabaseLoginDto) {
    this.logger.log(`Initiating Supabase sync for: ${dto.email}`);
    
    // 1. Verify token with Supabase
    const { data, error } = await this.supabase.auth.getUser(dto.token);
    
    if (error || !data.user) {
      this.logger.error(`Supabase verification failed for ${dto.email}: ${error?.message}`);
      throw new UnauthorizedException('Invalid Supabase token');
    }

    if (data.user.email !== dto.email) {
      this.logger.error(`Email mismatch: Supabase=${data.user.email}, DTO=${dto.email}`);
      throw new UnauthorizedException('Email mismatch');
    }

    this.logger.log(`Identity verified. Syncing user database record...`);
    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      create: {
        email: dto.email,
        fullName: dto.fullName || 'Social User',
        avatarUrl: dto.avatarUrl,
        emailVerified: true,
        referralCode: uuidv4(),
      },
      update: {
        fullName: dto.fullName || undefined, // Maintain existing if missing
        avatarUrl: dto.avatarUrl || undefined,
        emailVerified: true,
      },
    });

    // 3. Issue local tokens
    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.redisService.set(`auth:refresh:${user.id}:default`, tokens.refreshToken, 7 * 24 * 3600);

    return { 
      accessToken: tokens.accessToken, 
      user: this.sanitizeUser(user), 
      refreshTokenForCookie: tokens.refreshToken 
    };
  }

  private async generateTokenPair(userId: string, email: string, role: string) {
    const jti = uuidv4();
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role, jti },
      { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '1h') as any, secret: process.env.JWT_ACCESS_SECRET || 'profytron_v1_access_96e8b2c4d1a5f6b7c8d9e0f1a2b3c4d5' }
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, jti },
      { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any, secret: process.env.JWT_REFRESH_SECRET || 'profytron_v1_refresh_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p' }
    );
    return { accessToken, refreshToken };
  }

  public sanitizeUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
