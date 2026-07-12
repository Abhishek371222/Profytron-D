import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { Public, JwtAuthGuard } from '../auth/guards/auth.guard';

@ApiTags('Leaderboard')
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Public()
  @Get('monthly')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get monthly leaderboard rankings' })
  getMonthly(@Query('limit') limit?: string) {
    return this.leaderboardService.getMonthly(this.parseLimit(limit, 50));
  }

  @Public()
  @Get('alltime')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get all-time leaderboard rankings' })
  getAllTime(@Query('limit') limit?: string) {
    return this.leaderboardService.getAllTime(this.parseLimit(limit, 50));
  }

  @Public()
  @Get('strategies')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get top-performing verified strategies' })
  getTopStrategies(@Query('limit') limit?: string) {
    return this.leaderboardService.getTopStrategies(this.parseLimit(limit, 20));
  }

  @Get('me')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get current user rank across periods' })
  getMyRank(@Req() req: any) {
    return this.leaderboardService.getUserRank(req.user.userId);
  }

  private parseLimit(raw: string | undefined, fallback: number): number {
    if (raw == null || raw === '') return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
