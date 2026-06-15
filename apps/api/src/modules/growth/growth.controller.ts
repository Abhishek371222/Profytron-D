import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard, Roles, Public } from '../auth/guards/auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivationService, ACTIVATION_EVENTS } from './activation.service';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

class TrackEventDto {
  @IsString()
  @IsIn(Object.values(ACTIVATION_EVENTS))
  event!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

@ApiTags('Growth')
@Controller('growth')
export class GrowthController {
  constructor(private readonly activation: ActivationService) {}

  @Get('activation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user activation checklist and progress' })
  getActivation(@Req() req: { user: { userId: string } }) {
    return this.activation.getProgress(req.user.userId);
  }

  @Post('track')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track an activation milestone event' })
  async trackEvent(
    @Req() req: { user: { userId: string } },
    @Body() dto: TrackEventDto,
  ) {
    const tracked = await this.activation.track(
      req.user.userId,
      dto.event as (typeof ACTIVATION_EVENTS)[keyof typeof ACTIVATION_EVENTS],
      dto.metadata,
    );
    return { tracked };
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin revenue and activation KPIs' })
  getMetrics() {
    return this.activation.getAdminMetrics();
  }
}
