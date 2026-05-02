import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Affiliates')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Track a referral link click' })
  @Post('click/:code')
  async trackClick(@Param('code') code: string) {
    return this.affiliatesService.trackClick(code);
  }

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

  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({
    summary: 'Validate and capture referral code from landing flow',
  })
  @Post('capture/:code')
  async captureReferral(@Param('code') code: string) {
    return this.affiliatesService.captureReferralCode(code);
  }
}
