import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Trading')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trading')
export class TradingController {
  constructor(private tradingService: TradingService) {}

  @Post('emergency-stop')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Immediately halt and close all active trades' })
  async emergencyStop(@Req() req: any) {
    return this.tradingService.emergencyStop(req.user.id);
  }
}
