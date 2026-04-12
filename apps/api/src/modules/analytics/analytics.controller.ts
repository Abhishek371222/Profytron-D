import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get main portfolio performance metrics' })
  @Get('portfolio')
  async getPortfolio(@Req() req: any) {
    return this.analyticsService.getPortfolioStats(req.user.id);
  }

  @ApiOperation({ summary: 'Get performance heatmap by day/hour' })
  @Get('heatmap')
  async getHeatmap(@Req() req: any) {
    return this.analyticsService.getHeatmap(req.user.id);
  }
}
