import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: { id: string };
}

@ApiTags('Trading')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trading')
export class TradingController {
  constructor(private tradingService: TradingService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('emergency-stop')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Immediately halt and close all active trades' })
  async emergencyStop(@Req() req: RequestWithUser) {
    return this.tradingService.emergencyStop(req.user.id);
  }

  @Get('subscriptions')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'List all copy trading subscriptions for current user',
  })
  async getMySubscriptions(@Req() req: RequestWithUser) {
    return this.tradingService.getMySubscriptions(req.user.id);
  }

  @Patch('subscriptions/:id')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({
    summary: 'Update lot multiplier or pause/resume a subscription',
  })
  async updateSubscription(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body('lotMultiplier') lotMultiplier?: number,
    @Body('isPaused') isPaused?: boolean,
  ) {
    return this.tradingService.updateSubscription(req.user.id, id, {
      lotMultiplier:
        lotMultiplier !== undefined ? Number(lotMultiplier) : undefined,
      isPaused,
    });
  }

  @Get('trades/open')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Get all currently open trades for the authenticated user',
  })
  async getOpenTrades(@Req() req: RequestWithUser) {
    return this.tradingService.getOpenTrades(req.user.id);
  }

  @Get('trades/history')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Paginated closed trade history for the authenticated user',
  })
  async getTradeHistory(
    @Req() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('symbol') symbol?: string,
  ) {
    return this.tradingService.getTradeHistory(req.user.id, {
      limit: limit ? Math.min(Number(limit) || 20, 100) : 20,
      cursor,
      symbol,
    });
  }

  @Get('master-status')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get master sync poll status (admin/debug)' })
  async getMasterStatus() {
    return this.tradingService.getMasterStatus();
  }
}
