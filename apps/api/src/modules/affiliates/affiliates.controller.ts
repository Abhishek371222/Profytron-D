import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Affiliates')
@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @ApiOperation({ summary: 'Track a referral link click' })
  @Post('click/:code')
  async trackClick(@Param('code') code: string) {
    return this.affiliatesService.trackClick(code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user affiliate stats' })
  @Get('me')
  async getMyStats(@Req() req: any) {
    return this.affiliatesService.getAffiliateStats(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user affiliate dashboard' })
  @Get('dashboard')
  async getMyDashboard(@Req() req: any) {
    return this.affiliatesService.getAffiliateDashboard(req.user.id);
  }

  @ApiOperation({ summary: 'Validate and capture referral code from landing flow' })
  @Post('capture/:code')
  async captureReferral(@Param('code') code: string) {
    return this.affiliatesService.captureReferralCode(code);
  }
}
