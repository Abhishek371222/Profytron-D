import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('AI Coach')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @ApiOperation({ summary: 'Get AI-driven explanation for one of your trades' })
  @Post('explain-trade/:tradeId')
  async explainTradeById(@Req() req: any, @Param('tradeId') tradeId: string) {
    return this.aiService.explainTradeById(req.user.id, tradeId);
  }

  @ApiOperation({ summary: 'Get AI-driven explanation for a specific trade' })
  @Post('explain')
  async explain(@Body() tradeData: any) {
    return this.aiService.explainTrade(tradeData);
  }

  @ApiOperation({ summary: 'Send a prompt to AI coach chat' })
  @Post('chat')
  async chat(@Req() req: any, @Body() body: { message: string; context?: string }) {
    return this.aiService.chat(req.user.id, body);
  }

  @ApiOperation({ summary: 'Get personalized coaching report from recent behavior' })
  @Get('coaching-report')
  async getCoachingReport(@Req() req: any) {
    return this.aiService.getCoachingReport(req.user.id);
  }

  @ApiOperation({ summary: 'Get current global market regime analysis' })
  @Get('market-regime/:symbol')
  async getRegimeBySymbol(@Param('symbol') symbol: string) {
    return this.aiService.getMarketRegime(symbol);
  }

  @ApiOperation({ summary: 'Backward-compatible market regime endpoint' })
  @Get('regime')
  async getRegime() {
    return this.aiService.getMarketRegime('BTCUSDT');
  }
}
