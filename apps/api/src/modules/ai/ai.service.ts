import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';

  async explainTrade(tradeData: any) {
    try {
      this.logger.log(`Requesting AI explanation for trade on ${tradeData.asset}`);
      const response = await axios.post(`${this.baseUrl}/ai/explain-trade`, {
        asset: tradeData.asset,
        type: tradeData.type,
        entry: tradeData.entry,
        reason: tradeData.reason,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`AI Service error: ${error.message}`);
      throw new BadRequestException('AI Coach currently unavailable');
    }
  }

  async getMarketRegime() {
    try {
      const response = await axios.post(`${this.baseUrl}/ai/market-regime`, {});
      return response.data;
    } catch (error) {
      this.logger.error(`AI Service error: ${error.message}`);
      return {
        regime: 'UNKNOWN',
        adx: 0,
        atr_volatility: 'LOW',
        timestamp: new Date().toISOString()
      };
    }
  }
}
