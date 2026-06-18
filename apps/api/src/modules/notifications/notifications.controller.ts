import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsIn,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

class RegisterFcmTokenDto {
  @IsString()
  @MinLength(10)
  @MaxLength(512)
  token: string;

  @IsOptional()
  @IsString()
  @IsIn(['web', 'android', 'ios'])
  platform?: string;
}

class RemoveFcmTokenDto {
  @IsString()
  @MinLength(10)
  @MaxLength(512)
  token: string;
}

type AuthReq = { user: { id: string } };

@ApiTags('Notifications')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly fcmService: FcmService,
  ) {}

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'List all notifications for user' })
  @Get()
  async findAll(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findAll(
      req.user.id,
      Number(page || 1),
      Number(limit || 20),
      unreadOnly === 'true',
    );
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get unread notification count' })
  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthReq) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Mark notification as read' })
  @Patch(':id/read')
  async markAsRead(@Req() req: AuthReq, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @Patch('mark-all-read')
  async markAllAsRead(@Req() req: AuthReq) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @ApiResponse({ status: 200, description: 'Token registered' })
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  @Post('fcm-token')
  async registerFcmToken(
    @Req() req: AuthReq,
    @Body() dto: RegisterFcmTokenDto,
  ) {
    await this.fcmService.registerToken(
      req.user.id,
      dto.token,
      dto.platform || 'web',
    );
    return { success: true };
  }

  @ApiResponse({ status: 200, description: 'Token removed' })
  @ApiOperation({ summary: 'Remove FCM device token' })
  @Post('fcm-token/remove')
  async removeFcmToken(@Req() req: AuthReq, @Body() dto: RemoveFcmTokenDto) {
    await this.fcmService.removeToken(req.user.id, dto.token);
    return { success: true };
  }
}
