import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Trading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trading')
export class TradingController {
  constructor(private tradingService: TradingService) {}

  @Post('emergency-stop')
  @ApiOperation({ summary: 'Immediately halt and close all active trades' })
  async emergencyStop(@Req() req: any) {
    return this.tradingService.emergencyStop(req.user.id);
  }
}
