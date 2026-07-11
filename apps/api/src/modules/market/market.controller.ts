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
  @Get('quotes')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get latest quotes for all supported symbols' })
  getQuotes() {
    return this.marketService.getAllQuotes();
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

  @Public()
  @Get('news')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get live market news from Finnhub' })
  @ApiQuery({ name: 'category', required: false, example: 'general' })
  @ApiQuery({ name: 'minId', required: false, example: 0 })
  getNews(
    @Query('category') category?: string,
    @Query('minId') minId?: string,
  ) {
    const parsedMinId = minId ? Number(minId) : 0;
    return this.marketService.getMarketNews(
      category,
      Number.isFinite(parsedMinId) ? parsedMinId : 0,
    );
  }

  @Public()
  @Get('company-news')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get company news for a symbol from Finnhub' })
  @ApiQuery({ name: 'symbol', required: true, example: 'AAPL' })
  @ApiQuery({ name: 'from', required: false, example: '2026-07-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-07-11' })
  getCompanyNews(
    @Query('symbol') symbol?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!symbol?.trim()) {
      throw new BadRequestException('symbol is required');
    }
    return this.marketService.getCompanyNews(symbol, from, to);
  }

  @Public()
  @Get('economic-calendar')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get economic calendar events from Finnhub' })
  @ApiQuery({ name: 'from', required: false, example: '2026-07-10' })
  @ApiQuery({ name: 'to', required: false, example: '2026-07-17' })
  getEconomicCalendar(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.marketService.getEconomicCalendar(from, to);
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
