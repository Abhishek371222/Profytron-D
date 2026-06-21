import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TwoFaService } from './twofa.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResendOtpDto,
  SupabaseLoginDto,
  MagicLinkDto,
} from './dto/auth.dto';
import {
  Public,
  JwtAuthGuard,
  JwtRefreshGuard,
  GoogleAuthGuard,
} from './guards/auth.guard';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    refreshToken: string;
    jti: string;
    role?: string;
  };
};

class CompleteTwoFactorLoginDto {
  @IsUUID() challengeToken: string;
  @IsString() @MinLength(6) @MaxLength(16) code: string;
}

@ApiTags('Auth')
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFaService: TwoFaService,
  ) {}

  private setSessionCookies(
    res: Response,
    refreshToken: string,
    role?: string,
    onboardingCompleted?: boolean,
  ) {
    const isSecure = process.env.NODE_ENV === 'production';

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    if (role) {
      res.cookie('user_role', role, {
        httpOnly: false,
        secure: isSecure,
        sameSite: 'strict',
        path: '/',
        maxAge: 90 * 24 * 60 * 60 * 1000,
      });
    }

    if (onboardingCompleted !== undefined) {
      res.cookie('onboarding_completed', onboardingCompleted ? '1' : '0', {
        httpOnly: false,
        secure: isSecure,
        sameSite: 'strict',
        path: '/',
        maxAge: 90 * 24 * 60 * 60 * 1000,
      });
    }
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiResponse({ status: 201, description: 'Created — OTP sent to email' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiOperation({ summary: 'Register a new user account via email' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiResponse({ status: 200, description: 'Email verified — tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiOperation({ summary: 'Verify email registration OTP' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmail(dto);
    this.setSessionCookies(
      res,
      result.refreshTokenForCookie,
      result.user?.role,
      result.user?.onboardingCompleted,
    );
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiResponse({ status: 200, description: 'Authenticated — tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({
    status: 403,
    description: 'Account suspended or email unverified',
  })
  @ApiOperation({ summary: 'Authenticate a user' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, req);
    if (result.requiresTwoFa) {
      return { requiresTwoFa: true, challengeToken: result.challengeToken };
    }
    this.setSessionCookies(
      res,
      result.refreshTokenForCookie,
      result.user?.role,
      result.user?.onboardingCompleted,
    );
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('2fa/complete-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @ApiResponse({ status: 200, description: 'Authenticated — tokens issued' })
  @ApiResponse({
    status: 401,
    description: 'Invalid challenge token or 2FA code',
  })
  @ApiOperation({
    summary: 'Complete login by submitting 2FA code for challenge token',
  })
  async completeTwoFactorLogin(
    @Body() dto: CompleteTwoFactorLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.completeTwoFactorLogin(
      dto.challengeToken,
      dto.code,
      req,
    );
    this.setSessionCookies(
      res,
      result.refreshTokenForCookie,
      result.user?.role,
      result.user?.onboardingCompleted,
    );
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('supabase')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiResponse({ status: 200, description: 'Synchronized — tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid Supabase token' })
  @ApiOperation({
    summary:
      'Synchronize a Supabase authentication session with the local backend',
  })
  async supabaseLogin(
    @Body() dto: SupabaseLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.supabaseLogin(dto);
    if ('requiresTwoFa' in result && result.requiresTwoFa) {
      return {
        requiresTwoFa: true,
        challengeToken: result.challengeToken,
      };
    }
    this.setSessionCookies(
      res,
      result.refreshTokenForCookie,
      result.user?.role,
      result.user?.onboardingCompleted,
    );
    return { accessToken: result.accessToken, user: result.user };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiOperation({
    summary: 'Rotate and exchange session refresh token for access token',
  })
  async refresh(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.userId;
    const refreshToken = req.user?.refreshToken;
    const jti = req.user?.jti;
    if (!userId || !refreshToken || !jti) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const result = await this.authService.refresh(userId, refreshToken, jti);
    this.setSessionCookies(
      res,
      result.refreshTokenForCookie,
      result.user?.role,
      result.user?.onboardingCompleted,
    );
    return { accessToken: result.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Session destroyed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiOperation({ summary: 'Destroy current session' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.userId;
    const jti = req.user?.jti;
    if (!userId || !jti) {
      throw new UnauthorizedException('Invalid session');
    }

    await this.authService.logout(userId, jti);
    const isSecure = process.env.NODE_ENV === 'production';
    const cookieOpts = {
      path: '/',
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict' as const,
    };
    res.clearCookie('refresh_token', cookieOpts);
    res.clearCookie('user_role', { ...cookieOpts, httpOnly: false });
    res.clearCookie('onboarding_completed', { ...cookieOpts, httpOnly: false });
    return { success: true };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900000, limit: 3 } })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  @ApiOperation({ summary: 'Request password reset token via email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  @ApiOperation({ summary: 'Reset password via email token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiResponse({ status: 200, description: 'OTP resent' })
  @ApiOperation({ summary: 'Resend OTP to email' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  // ──────────────────────────── MAGIC LINK ────────────────────────────

  @Public()
  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiResponse({ status: 200, description: 'Magic link sent if email exists' })
  @ApiOperation({ summary: 'Send passwordless magic link to email' })
  async sendMagicLink(@Body() dto: MagicLinkDto) {
    return this.authService.sendMagicLink(dto.email);
  }

  @Public()
  @Get('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiResponse({ status: 200, description: 'Authenticated — tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid or expired link' })
  @ApiOperation({ summary: 'Verify magic link token and authenticate' })
  async verifyMagicLink(
    @Query('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyMagicLink(token);
    if ('requiresTwoFa' in result && result.requiresTwoFa) {
      return {
        requiresTwoFa: true,
        challengeToken: result.challengeToken,
      };
    }
    this.setSessionCookies(
      res,
      result.refreshTokenForCookie,
      result.user?.role,
      result.user?.onboardingCompleted,
    );
    return { accessToken: result.accessToken, user: result.user };
  }

  // ──────────────────────────── 2FA ────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'QR code and secret returned' })
  @ApiOperation({ summary: 'Begin 2FA setup — returns QR code URI' })
  async setup2fa(@Req() req: AuthenticatedRequest) {
    return this.twoFaService.setupTwoFa(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify-setup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @ApiResponse({
    status: 200,
    description: '2FA enabled, backup codes returned',
  })
  @ApiResponse({ status: 400, description: 'Invalid TOTP code' })
  @ApiOperation({ summary: 'Confirm TOTP code to enable 2FA' })
  async verify2faSetup(
    @Req() req: AuthenticatedRequest,
    @Body('token') token: string,
  ) {
    return this.twoFaService.verifyAndEnable(req.user.userId, token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @ApiResponse({ status: 200, description: '2FA disabled' })
  @ApiResponse({ status: 400, description: 'Invalid TOTP or backup code' })
  @ApiOperation({ summary: 'Disable 2FA with current TOTP or backup code' })
  async disable2fa(
    @Req() req: AuthenticatedRequest,
    @Body('token') token: string,
  ) {
    return this.twoFaService.disable(req.user.userId, token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/backup-codes')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 300000, limit: 5 } })
  @ApiResponse({ status: 200, description: 'New backup codes generated' })
  @ApiOperation({ summary: 'Regenerate 2FA backup codes' })
  async regenerateBackupCodes(
    @Req() req: AuthenticatedRequest,
    @Body('token') token: string,
  ) {
    return this.twoFaService.regenerateBackupCodes(req.user.userId, token);
  }

  // ──────────────────────────── GITHUB OAuth ────────────────────────────

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiResponse({ status: 302, description: 'Redirect to GitHub OAuth' })
  @ApiOperation({ summary: 'Initiate GitHub OAuth2 SSO' })
  async githubAuth() {}

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiResponse({ status: 302, description: 'Redirect to dashboard with token' })
  @ApiOperation({ summary: 'Handle GitHub OAuth2 Callback' })
  async githubCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const result = await this.authService.githubCallback(req.user);
    if (result.refreshTokenForCookie) {
      this.setSessionCookies(
        res,
        result.refreshTokenForCookie,
        result.user?.role,
        result.user?.onboardingCompleted,
      );
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    // The access token is exchanged via a server-side one-time code rather than
    // a JS-readable cookie. The frontend calls GET /auth/oauth-token-exchange?code=
    // to retrieve the bearer token once, then the code is consumed and deleted.
    const dest = result.user?.onboardingCompleted
      ? '/dashboard'
      : '/onboarding/risk';
    res.redirect(`${frontendUrl}${dest}?oauthCode=${result.oauthCode}`);
  }

  // ──────────────────────────── GOOGLE OAuth ────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth2' })
  @ApiOperation({ summary: 'Initiate Google OAuth2 SSO' })
  async googleAuth() {
    // Initiates redirect
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiResponse({ status: 302, description: 'Redirect to dashboard' })
  @ApiOperation({ summary: 'Handle Google OAuth2 Callback' })
  async googleCallback(
    @Req()
    req: Request & {
      user: {
        email: string;
        fullName?: string;
        avatarUrl?: string;
        googleId?: string;
      };
    },
    @Res() res: Response,
  ) {
    const result = await this.authService.googleCallback(req.user);
    if (result.refreshTokenForCookie) {
      this.setSessionCookies(
        res,
        result.refreshTokenForCookie,
        result.user?.role,
        result.user?.onboardingCompleted,
      );
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dest = result.user?.onboardingCompleted
      ? process.env.FRONTEND_DASHBOARD_URL || `${frontendUrl}/dashboard`
      : `${frontendUrl}/onboarding/risk`;
    res.redirect(`${dest}?oauthCode=${result.oauthCode}`);
  }

  @Public()
  @Get('oauth-token-exchange')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiResponse({
    status: 200,
    description: 'Access token returned — code consumed',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OAuth code' })
  @ApiOperation({
    summary: 'Exchange a one-time OAuth code for an access token',
  })
  async oauthTokenExchange(@Query('code') code: string) {
    if (!code) throw new NotFoundException('code is required');
    return this.authService.exchangeOAuthCode(code);
  }
}
