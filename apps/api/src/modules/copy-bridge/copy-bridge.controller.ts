import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/guards/auth.guard';
import { CopyBridgeService } from './copy-bridge.service';

@ApiTags('Copy Bridge')
@Controller('bridge')
export class CopyBridgeController {
  constructor(private readonly bridge: CopyBridgeService) {}

  private tokenFrom(
    headerToken?: string,
    queryToken?: string,
  ): string | undefined {
    return headerToken?.trim() || queryToken?.trim();
  }

  @Public()
  @Get('orders')
  @ApiOperation({
    summary:
      'Poll pending copy orders for the MT5 bridge EA (claims them atomically)',
  })
  @ApiHeader({ name: 'X-Bridge-Token', required: false })
  async pollOrders(
    @Headers('x-bridge-token') headerToken: string | undefined,
    @Query('token') queryToken: string | undefined,
    @Query('limit') limit?: string,
  ) {
    return this.bridge.pollPending(
      this.tokenFrom(headerToken, queryToken) ?? '',
      limit ? Number(limit) : 10,
    );
  }

  @Public()
  @Post('orders/:id/result')
  @ApiOperation({
    summary: 'Report FILLED or FAILED after the EA executes a bridge order',
  })
  @ApiHeader({ name: 'X-Bridge-Token', required: false })
  async reportResult(
    @Param('id') orderId: string,
    @Headers('x-bridge-token') headerToken: string | undefined,
    @Query('token') queryToken: string | undefined,
    @Body()
    body: {
      status: 'FILLED' | 'FAILED';
      brokerTicket?: string;
      fillPrice?: number;
      errorReason?: string;
    },
  ) {
    return this.bridge.reportResult(
      this.tokenFrom(headerToken, queryToken) ?? '',
      orderId,
      body,
    );
  }
}
