import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/guards/auth.guard';
import {
  MarketService,
  type MarketSymbol,
  type MarketTimeframe,
} from './market.service';

@ApiTags('Market')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Public()
  @Get('quote')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get latest quote for a supported symbol' })
  @ApiQuery({ name: 'symbol', required: false, example: 'BTCUSDT' })
  getQuote(@Query('symbol') symbol?: string) {
    const normalized = this.normalizeSymbol(symbol);
    return this.marketService.getQuote(normalized);
  }

  @Public()
  @Get('ohlc')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get OHLCV candlestick data for charting' })
  @ApiQuery({ name: 'symbol', required: false, example: 'BTCUSDT' })
  @ApiQuery({ name: 'timeframe', required: false, example: '15m' })
  @ApiQuery({ name: 'limit', required: false, example: 220 })
  getOHLC(
    @Query('symbol') symbol?: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string,
  ) {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    const normalizedTimeframe = this.normalizeTimeframe(timeframe);
    const normalizedLimit = this.normalizeLimit(limit);
    return this.marketService.getOHLC(
      normalizedSymbol,
      normalizedTimeframe,
      normalizedLimit,
    );
  }

  private normalizeSymbol(value?: string): MarketSymbol {
    const fallback: MarketSymbol = 'BTCUSDT';
    if (!value) return fallback;

    const normalized = value.toUpperCase();
    if (
      !this.marketService.supportedSymbols.includes(normalized as MarketSymbol)
    ) {
      throw new BadRequestException(
        `Unsupported symbol. Supported values: ${this.marketService.supportedSymbols.join(', ')}`,
      );
    }
    return normalized as MarketSymbol;
  }

  private normalizeTimeframe(value?: string): MarketTimeframe {
    const fallback: MarketTimeframe = '15m';
    if (!value) return fallback;

    const normalized = value.toLowerCase();
    if (
      !this.marketService.supportedTimeframes.includes(
        normalized as MarketTimeframe,
      )
    ) {
      throw new BadRequestException(
        `Unsupported timeframe. Supported values: ${this.marketService.supportedTimeframes.join(', ')}`,
      );
    }
    return normalized as MarketTimeframe;
  }

  private normalizeLimit(value?: string): number {
    if (!value) return 220;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('Limit must be a valid number');
    }
    return parsed;
  }
}
