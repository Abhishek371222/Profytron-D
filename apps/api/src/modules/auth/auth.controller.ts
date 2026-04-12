import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode, HttpStatus, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ResendOtpDto, SupabaseLoginDto } from './dto/auth.dto';
import { Public, JwtAuthGuard, JwtRefreshGuard, GoogleAuthGuard } from './guards/auth.guard';
import type { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account via email' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email registration OTP' })
  async verifyEmail(@Body() dto: VerifyEmailDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyEmail(dto);
    res.cookie('refresh_token', result.refreshTokenForCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate a user' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, req);
    res.cookie('refresh_token', result.refreshTokenForCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('supabase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synchronize a Supabase authentication session with the local backend' })
  async supabaseLogin(@Body() dto: SupabaseLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.supabaseLogin(dto);
    res.cookie('refresh_token', result.refreshTokenForCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and exchange session refresh token for access token' })
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { userId, refreshToken, jti } = req.user;
    const result = await this.authService.refresh(userId, refreshToken, jti);
    res.cookie('refresh_token', result.refreshTokenForCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Destroy current session' })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { userId, jti } = req.user;
    await this.authService.logout(userId, jti);
    res.clearCookie('refresh_token', { path: '/' });
    return { success: true };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  // @Throttle(5, 900) - requires throttler setup if strict
  @ApiOperation({ summary: 'Request password reset token via email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password via email token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to email' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth2 SSO' })
  async googleAuth() {
    // Initiates redirect
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Handle Google OAuth2 Callback' })
  @Redirect(process.env.FRONTEND_URL || 'http://localhost:3000/dashboard')
  async googleCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.googleCallback(req.user);
    res.cookie('refresh_token', result.refreshTokenForCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Can optionally append access_token to redirect hash or handle differently via popup messaging
    return { url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?token=${result.accessToken}` };
  }
}
