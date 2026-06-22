import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  IsBoolean,
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

class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() inAppEnabled?: boolean;
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsBoolean() securityAlerts?: boolean;
  @IsOptional() @IsBoolean() tradingAlerts?: boolean;
  @IsOptional() @IsBoolean() paymentAlerts?: boolean;
  @IsOptional() @IsBoolean() systemAlerts?: boolean;
  @IsOptional() @IsBoolean() marketingAlerts?: boolean;
  @IsOptional() @IsBoolean() accountAlerts?: boolean;
  @IsOptional() @IsBoolean() quietHoursEnabled?: boolean;
  @IsOptional() @IsString() quietHoursStart?: string;
  @IsOptional() @IsString() quietHoursEnd?: string;
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

  @ApiOperation({
    summary: 'List notifications (paginated, filterable by category/unread)',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async findAll(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('category') category?: string,
  ) {
    return this.notificationsService.findAll(
      req.user.id,
      Number(page || 1),
      Number(limit || 20),
      unreadOnly === 'true',
      category,
    );
  }

  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthReq) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('preferences')
  async getPreferences(@Req() req: AuthReq) {
    return this.notificationsService.getPreferences(req.user.id);
  }

  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('preferences')
  async updatePreferences(
    @Req() req: AuthReq,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(req.user.id, dto);
  }

  @ApiOperation({
    summary:
      'Mark all notifications as seen (clears badge without marking read)',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('mark-seen')
  async markSeen(@Req() req: AuthReq) {
    return this.notificationsService.markSeen(req.user.id);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('mark-all-read')
  async markAllAsRead(@Req() req: AuthReq) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/read')
  async markAsRead(@Req() req: AuthReq, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @ApiOperation({ summary: 'Delete a single notification' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Delete(':id')
  async deleteOne(@Req() req: AuthReq, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }

  @ApiOperation({ summary: 'Delete all notifications for the user' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Delete()
  async deleteAll(@Req() req: AuthReq) {
    return this.notificationsService.deleteAll(req.user.id);
  }

  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  @ApiResponse({ status: 200, description: 'Token registered' })
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

  @ApiOperation({ summary: 'Remove FCM device token' })
  @ApiResponse({ status: 200, description: 'Token removed' })
  @Post('fcm-token/remove')
  async removeFcmToken(@Req() req: AuthReq, @Body() dto: RemoveFcmTokenDto) {
    await this.fcmService.removeToken(req.user.id, dto.token);
    return { success: true };
  }
}
