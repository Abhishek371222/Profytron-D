import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { AccountSnapshotService } from './account-snapshot.service';

type AuthReq = { user: { userId: string } };

@ApiTags('Broker Account Snapshots')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('broker/accounts/:id/snapshot')
export class AccountSnapshotController {
  constructor(private readonly snapshots: AccountSnapshotService) {}

  @Get('latest')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary:
      'Get the newest DB-stored account snapshot (balance/equity/margin/positions) — never calls MetaAPI directly',
  })
  async getLatest(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.snapshots.getLatestSnapshot(req.user.userId, accountId);
  }

  @Get('summary')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get latest account summary from the database' })
  async getSummary(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.snapshots.getSummary(req.user.userId, accountId);
  }

  @Get('history')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get historical account snapshots, newest first' })
  async getHistory(
    @Req() req: AuthReq,
    @Param('id') accountId: string,
    @Query('limit') limit?: string,
  ) {
    return this.snapshots.getSnapshotHistory(
      req.user.userId,
      accountId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('positions')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get open positions from the latest stored snapshot' })
  async getPositions(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.snapshots.getPositions(req.user.userId, accountId);
  }

  @Get('pending-orders')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get pending orders from the latest stored snapshot' })
  async getPendingOrders(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.snapshots.getPendingOrders(req.user.userId, accountId);
  }

  @Get('deals')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get historical deals stored by background sync' })
  async getDeals(
    @Req() req: AuthReq,
    @Param('id') accountId: string,
    @Query('limit') limit?: string,
  ) {
    return this.snapshots.getDeals(
      req.user.userId,
      accountId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('balance-history')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get balance history from stored snapshots' })
  async getBalanceHistory(
    @Req() req: AuthReq,
    @Param('id') accountId: string,
    @Query('limit') limit?: string,
  ) {
    return this.snapshots.getBalanceHistory(
      req.user.userId,
      accountId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('equity-history')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get equity history from stored snapshots' })
  async getEquityHistory(
    @Req() req: AuthReq,
    @Param('id') accountId: string,
    @Query('limit') limit?: string,
  ) {
    return this.snapshots.getEquityHistory(
      req.user.userId,
      accountId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('drawdown-history')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get drawdown history from stored analytics' })
  async getDrawdownHistory(
    @Req() req: AuthReq,
    @Param('id') accountId: string,
    @Query('limit') limit?: string,
  ) {
    return this.snapshots.getDrawdownHistory(
      req.user.userId,
      accountId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('returns-history')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get returns history from stored analytics' })
  async getReturnsHistory(
    @Req() req: AuthReq,
    @Param('id') accountId: string,
    @Query('limit') limit?: string,
  ) {
    return this.snapshots.getReturnsHistory(
      req.user.userId,
      accountId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('analytics')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get latest computed analytics snapshot' })
  async getAnalytics(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.snapshots.getAnalytics(req.user.userId, accountId);
  }

  @Get('performance')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get latest computed performance metrics' })
  async getPerformance(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.snapshots.getPerformance(req.user.userId, accountId);
  }

  @Get('risk')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get latest computed risk metrics' })
  async getRisk(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.snapshots.getRisk(req.user.userId, accountId);
  }

  @Get('symbols')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get latest symbol statistics from the snapshot' })
  async getSymbols(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.snapshots.getSymbols(req.user.userId, accountId);
  }

  @Get('timeline')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get account event timeline from stored snapshots' })
  async getTimeline(
    @Req() req: AuthReq,
    @Param('id') accountId: string,
    @Query('limit') limit?: string,
  ) {
    return this.snapshots.getTimeline(
      req.user.userId,
      accountId,
      limit ? Number(limit) : undefined,
    );
  }
}
