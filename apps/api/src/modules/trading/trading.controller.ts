import { Controller, Post, UseGuards, Req } from '@nestjs/common';
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
  user: {
    id: string;
  };
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
}
