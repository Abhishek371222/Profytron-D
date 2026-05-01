import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
    return this.leaderboardService.getMonthly(limit ? parseInt(limit, 10) : 50);
  }

  @Public()
  @Get('alltime')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get all-time leaderboard rankings' })
  getAllTime(@Query('limit') limit?: string) {
    return this.leaderboardService.getAllTime(limit ? parseInt(limit, 10) : 50);
  }

  @Public()
  @Get('strategies')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get top-performing verified strategies' })
  getTopStrategies(@Query('limit') limit?: string) {
    return this.leaderboardService.getTopStrategies(limit ? parseInt(limit, 10) : 20);
  }

  @Get('me')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get current user rank across periods' })
  getMyRank(@Req() req: any) {
    return this.leaderboardService.getUserRank(req.user.userId);
  }
}
