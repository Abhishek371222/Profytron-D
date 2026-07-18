import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { EmailService } from '../email/email.service';
import {
  UpdateProfileDto,
  UpdateRiskProfileDto,
  DeleteAccountDto,
  VerifyDeleteAccountOtpDto,
  RequestPasswordResetOtpDto,
  VerifyPasswordResetOtpDto,
  ConfirmPasswordResetDto,
} from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import type { Request, Response, Express } from 'express';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    jti?: string;
  };
};

@ApiTags('Users')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  private clearSessionCookies(res: Response) {
    const isSecure =
      process.env.NODE_ENV === 'production' ||
      process.env.COOKIE_SECURE === 'true';
    const cookieOpts = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      path: '/',
    };
    res.clearCookie('refresh_token', cookieOpts);
    res.clearCookie('user_role', { ...cookieOpts, httpOnly: false });
    res.clearCookie('onboarding_completed', { ...cookieOpts, httpOnly: false });
  }
  @Get('me')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('me')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Upload avatar to Supabase storage' })
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.usersService.uploadAvatar(req.user.userId, file);
  }

  @Patch('me/risk-profile')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Update Risk Profile (Onboarding Step 4)' })
  async updateRiskProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateRiskProfileDto,
  ) {
    return this.usersService.updateRiskProfile(req.user.userId, dto);
  }

  @Get('me/sessions')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get active sessions' })
  async getSessions(@Req() req: AuthenticatedRequest) {
    return this.usersService.getSessions(req.user.userId);
  }

  @Delete('me/sessions/:id')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Revoke specific session' })
  async revokeSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
  ) {
    return this.usersService.revokeSession(req.user.userId, sessionId);
  }

  @Delete('me/sessions')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Revoke all other sessions' })
  async revokeAllOtherSessions(@Req() req: AuthenticatedRequest) {
    if (!req.user.jti) {
      throw new BadRequestException(
        'Current session token identifier is missing',
      );
    }

    return this.usersService.revokeAllOtherSessions(
      req.user.userId,
      req.user.jti,
    );
  }

  @Post('me/password-reset/request-otp')
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary: 'Send OTP to registered email to begin in-app password reset',
  })
  async requestPasswordResetOtp(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RequestPasswordResetOtpDto,
  ) {
    return this.usersService.requestPasswordResetOtp(
      req.user.userId,
      dto.email,
    );
  }

  @Post('me/password-reset/verify-otp')
  @ApiResponse({ status: 200, description: 'OTP verified' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary: 'Verify password-reset OTP before setting a new password',
  })
  async verifyPasswordResetOtp(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyPasswordResetOtpDto,
  ) {
    return this.usersService.verifyPasswordResetOtp(
      req.user.userId,
      dto.email,
      dto.otp,
    );
  }

  @Post('me/password-reset/confirm')
  @ApiResponse({ status: 200, description: 'Password reset' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary:
      'Confirm new password after OTP verification and revoke existing sessions',
  })
  async confirmPasswordReset(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: ConfirmPasswordResetDto,
  ) {
    const result = await this.usersService.confirmPasswordReset(
      req.user.userId,
      dto.email,
      dto.newPassword,
      dto.confirmPassword,
    );
    this.clearSessionCookies(res);
    return result;
  }

  @Post('me/delete/request-otp')
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary: 'Send OTP to email to begin account deletion',
  })
  async requestDeleteAccountOtp(@Req() req: AuthenticatedRequest) {
    return this.usersService.requestDeleteAccountOtp(req.user.userId);
  }

  @Post('me/delete/verify-otp')
  @ApiResponse({ status: 200, description: 'OTP verified' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary: 'Verify delete-account OTP before final confirmation',
  })
  async verifyDeleteAccountOtp(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyDeleteAccountOtpDto,
  ) {
    return this.usersService.verifyDeleteAccountOtp(req.user.userId, dto.otp);
  }

  @Delete('me')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary:
      'Permanently deactivate account after OTP verification and final confirm',
  })
  async deleteAccount(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: DeleteAccountDto,
  ) {
    const result = await this.usersService.deleteAccount(
      req.user.userId,
      dto.finalConfirm,
    );

    this.clearSessionCookies(res);

    return result;
  }

  @Get('me/kyc')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get KYC verification status and documents' })
  async getKycStatus(@Req() req: AuthenticatedRequest) {
    return this.usersService.getKycStatus(req.user.userId);
  }

  @Post('me/kyc')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['docType', 'file'],
      properties: {
        docType: {
          type: 'string',
          enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE'],
        },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document submitted for review' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Submit KYC document for verification' })
  async submitKyc(
    @Req() req: AuthenticatedRequest,
    @Body('docType') docType: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Document file is required');
    if (!docType) throw new BadRequestException('docType is required');
    return this.usersService.submitKycDocument(req.user.userId, docType, file);
  }

  @Get('me/email-history')
  @ApiOperation({
    summary: 'Get full email history for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Email history returned' })
  async getEmailHistory(@Req() req: AuthenticatedRequest) {
    return this.emailService.getEmailHistory({ userId: req.user.userId });
  }
}
