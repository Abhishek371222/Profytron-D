import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiRiskService } from './ai-risk.service';

@ApiTags('Risk')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('risk')
export class AiRiskController {
  constructor(private readonly aiRiskService: AiRiskService) {}

  @Get('metrics')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get your trading risk metrics' })
  async getMetrics(@Req() req: any) {
    return this.aiRiskService.getRiskMetrics(req.user.id);
  }

  @Get('score')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Get behavioral risk score (0-100). LOW <40, MEDIUM 40-69, HIGH 70+',
  })
  async getRiskScore(@Req() req: any) {
    const score = await this.aiRiskService.computeRiskScore(req.user.id);
    const label = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    return { score, label };
  }

  @Get('policy')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get your current AI risk policy' })
  async getPolicy(@Req() req: any) {
    return this.aiRiskService.getRiskPolicy(req.user.id);
  }
}
