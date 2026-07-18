import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AffiliatesService } from './affiliates.service';
import { JwtAuthGuard, Public } from '../auth/guards/auth.guard';
import { RequestWithdrawalDto } from './dto/affiliates.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('Affiliates')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@Controller('affiliates')
export class AffiliatesController {
  constructor(
    private readonly affiliatesService: AffiliatesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get current user affiliate stats' })
  @Get('me')
  async getMyStats(@Req() req: any) {
    return this.affiliatesService.getAffiliateStats(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get current user affiliate dashboard' })
  @Get('dashboard')
  async getMyDashboard(@Req() req: any) {
    return this.affiliatesService.getAffiliateDashboard(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'List users referred by the current affiliate' })
  @Get('referrals')
  async getMyReferrals(@Req() req: any) {
    return this.affiliatesService.getReferrals(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get referral funnel activity chart data' })
  @Get('activity')
  async getMyActivity(@Req() req: any, @Query('range') range?: string) {
    return this.affiliatesService.getActivityChart(req.user.id, range);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Top affiliates ranked by lifetime earnings' })
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.affiliatesService.getLeaderboard(
      limit ? Number(limit) : undefined,
    );
  }

  @Public()
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({
    summary: 'Validate and capture referral code from landing flow',
  })
  @Post('capture/:code')
  async captureReferral(
    @Param('code') code: string,
    @Req() req: Request,
    @Headers('x-affiliate-visitor-id') visitorIdHeader?: string,
  ) {
    const visitorId =
      typeof visitorIdHeader === 'string' ? visitorIdHeader.trim() : '';
    const viewerUserId = this.tryResolveViewerUserId(req);

    return this.affiliatesService.captureReferralCode(code, {
      visitorId,
      viewerUserId,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Withdrawal requested' })
  @ApiOperation({ summary: 'Request affiliate earnings withdrawal' })
  @Post('withdraw')
  async requestWithdrawal(@Req() req: any, @Body() body: RequestWithdrawalDto) {
    return this.affiliatesService.requestWithdrawal(req.user.id, body.amount);
  }

  private tryResolveViewerUserId(req: Request): string | undefined {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken || typeof refreshToken !== 'string') {
      return undefined;
    }

    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      return undefined;
    }

    try {
      const payload = this.jwtService.verify<{ sub?: string }>(refreshToken, {
        secret,
        algorithms: ['HS256'],
      });
      if (payload?.sub && typeof payload.sub === 'string') {
        return payload.sub;
      }
    } catch {
      /* ignore */
    }

    return undefined;
  }
}
