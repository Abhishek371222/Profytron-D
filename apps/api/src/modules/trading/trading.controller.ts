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
import { RolesGuard, Roles } from '../auth/guards/auth.guard';
import {
  CloseTradeDto,
  ModifyTradeDto,
  BreakEvenDto,
  TrailingStopDto,
  BulkCloseDto,
  ManualOrderDto,
} from './dto/trade-actions.dto';
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

  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('trades/order')
  @ApiResponse({ status: 201, description: 'Order queued' })
  @ApiOperation({ summary: 'Place a manual market order' })
  async placeOrder(@Req() req: RequestWithUser, @Body() dto: ManualOrderDto) {
    return this.tradingService.placeManualOrder(req.user.id, dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Post('trades/bulk-close')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Bulk close trades (all / buys / sells / profitable / losing)',
  })
  async bulkClose(@Req() req: RequestWithUser, @Body() dto: BulkCloseDto) {
    return this.tradingService.bulkClose(req.user.id, dto.scope);
  }

  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Post('trades/:id/close')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Close (or partially close) an open trade' })
  async closeTrade(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: CloseTradeDto,
  ) {
    return this.tradingService.closeTrade(req.user.id, id, dto.volume);
  }

  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Patch('trades/:id/modify')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Modify stop-loss / take-profit of an open trade' })
  async modifyTrade(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: ModifyTradeDto,
  ) {
    return this.tradingService.modifyTrade(req.user.id, id, dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Post('trades/:id/break-even')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Move stop-loss to break-even' })
  async breakEven(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: BreakEvenDto,
  ) {
    return this.tradingService.breakEven(req.user.id, id, dto.offsetPips);
  }

  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Post('trades/:id/trailing-stop')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Attach a trailing stop to an open trade' })
  async trailingStop(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: TrailingStopDto,
  ) {
    return this.tradingService.setTrailingStop(req.user.id, id, dto.distance);
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

  @Post('sync-bots')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary:
      'Pull MetaAPI positions into DB, attribute them to bots, refresh per-bot PnL',
  })
  async syncBots(@Req() req: RequestWithUser) {
    return this.tradingService.syncBotTrades(req.user.id);
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
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiOperation({ summary: 'Get master sync poll status (admin only)' })
  async getMasterStatus() {
    return this.tradingService.getMasterStatus();
  }
}
