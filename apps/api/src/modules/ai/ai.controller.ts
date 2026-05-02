import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@ApiTags('AI Coach')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Get AI-driven explanation for one of your trades' })
  @Post('explain-trade/:tradeId')
  async explainTradeById(
    @Req() req: AuthenticatedRequest,
    @Param('tradeId') tradeId: string,
  ) {
    return this.aiService.explainTradeById(req.user.id, tradeId);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Get AI-driven explanation for a specific trade' })
  @Post('explain')
  async explain(@Body() tradeData: any) {
    return this.aiService.explainTrade(tradeData);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Send a prompt to AI coach chat' })
  @Post('chat')
  async chat(
    @Req() req: AuthenticatedRequest,
    @Body() body: { message: string; context?: string },
  ) {
    return this.aiService.chat(req.user.id, body);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Get personalized coaching report from recent behavior',
  })
  @Get('coaching-report')
  async getCoachingReport(@Req() req: AuthenticatedRequest) {
    return this.aiService.getCoachingReport(req.user.id);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get current global market regime analysis' })
  @Get('market-regime/:symbol')
  async getRegimeBySymbol(@Param('symbol') symbol: string) {
    return this.aiService.getMarketRegime(symbol);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Backward-compatible market regime endpoint' })
  @Get('regime')
  async getRegime() {
    return this.aiService.getMarketRegime('BTCUSDT');
  }
}
