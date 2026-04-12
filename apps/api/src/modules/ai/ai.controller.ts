import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('AI Coach')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @ApiOperation({ summary: 'Get AI-driven explanation for a specific trade' })
  @Post('explain')
  async explain(@Body() tradeData: any) {
    return this.aiService.explainTrade(tradeData);
  }

  @ApiOperation({ summary: 'Get current global market regime analysis' })
  @Get('regime')
  async getRegime() {
    return this.aiService.getMarketRegime();
  }
}
