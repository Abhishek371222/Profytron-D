import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Req,
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
import {
  UpdateProfileDto,
  UpdateRiskProfileDto,
  ChangePasswordDto,
  DeleteAccountDto,
} from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import type { Request, Express } from 'express';

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
  constructor(private readonly usersService: UsersService) {}

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
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
    // Current session ID passed from JWT payload
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

  @Post('me/change-password')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Change password and revoke refresh tokens' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.userId, dto);
  }

  @Delete('me')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.usersService.deleteAccount(req.user.userId, dto.confirmText);
  }

  // ──────────────────────────── KYC ────────────────────────────

  @Get('me/kyc')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get KYC verification status and documents' })
  async getKycStatus(@Req() req: AuthenticatedRequest) {
    return this.usersService.getKycStatus(req.user.userId);
  }

  @Post('me/kyc')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['docType', 'file'],
      properties: {
        docType: { type: 'string', enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE'] },
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
}
