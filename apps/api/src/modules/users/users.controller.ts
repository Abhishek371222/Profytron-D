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
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    jti?: string;
  };
};

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('me')
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
  @ApiOperation({ summary: 'Update Risk Profile (Onboarding Step 4)' })
  async updateRiskProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateRiskProfileDto,
  ) {
    return this.usersService.updateRiskProfile(req.user.userId, dto);
  }

  @Get('me/sessions')
  @ApiOperation({ summary: 'Get active sessions' })
  async getSessions(@Req() req: AuthenticatedRequest) {
    return this.usersService.getSessions(req.user.userId);
  }

  @Delete('me/sessions/:id')
  @ApiOperation({ summary: 'Revoke specific session' })
  async revokeSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
  ) {
    return this.usersService.revokeSession(req.user.userId, sessionId);
  }

  @Delete('me/sessions')
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
  @ApiOperation({ summary: 'Change password and revoke refresh tokens' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.userId, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete account' })
  async deleteAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.usersService.deleteAccount(req.user.userId, dto.confirmText);
  }
}
