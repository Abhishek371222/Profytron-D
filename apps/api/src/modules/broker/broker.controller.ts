import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { BrokerService } from './broker.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { ConnectBrokerDto } from './dto/broker.dto';

type AuthReq = { user: { userId: string } };

@ApiTags('Broker')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('broker/accounts')
export class BrokerController {
  constructor(private readonly brokerService: BrokerService) {}

  @Post('connect')
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary: 'Connect a new broker account (secure AES storage)',
  })
  async connectBroker(@Req() req: AuthReq, @Body() dto: ConnectBrokerDto) {
    return this.brokerService.connectBroker(req.user.userId, dto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Get all connected broker accounts for current user',
  })
  async getBrokerAccounts(@Req() req: AuthReq) {
    return this.brokerService.getBrokerAccounts(req.user.userId);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Disconnect an active broker account' })
  async disconnectBroker(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.brokerService.disconnectBroker(req.user.userId, accountId);
  }

  @Post(':id/test')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Run a live connection test to verify credentials' })
  async testConnection(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.brokerService.testConnection(req.user.userId, accountId);
  }

  @Post(':id/bridge-token')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({
    summary:
      'Rotate the MT5 bridge EA token (returned once; paste into ProfytronCopyBridge)',
  })
  async rotateBridgeToken(@Req() req: AuthReq, @Param('id') accountId: string) {
    return this.brokerService.rotateBridgeToken(req.user.userId, accountId);
  }

  @Post(':id/share')
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary:
      'Share view-only access to a broker account with a teammate (Business+ plan)',
  })
  async shareAccount(
    @Req() req: AuthReq,
    @Param('id') accountId: string,
    @Body('email') email: string,
  ) {
    return this.brokerService.shareBrokerAccount(
      req.user.userId,
      accountId,
      email,
    );
  }
}

@ApiTags('Broker')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('broker/shares')
export class BrokerSharesController {
  constructor(private readonly brokerService: BrokerService) {}

  @Get()
  @ApiOperation({
    summary:
      'List broker account shares owned by / shared with the current user',
  })
  async listShares(@Req() req: AuthReq) {
    return this.brokerService.listShares(req.user.userId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a pending broker account share invite' })
  async acceptShare(@Req() req: AuthReq, @Param('id') shareId: string) {
    return this.brokerService.acceptShare(req.user.userId, shareId);
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Decline a pending broker account share invite' })
  async declineShare(@Req() req: AuthReq, @Param('id') shareId: string) {
    return this.brokerService.declineShare(req.user.userId, shareId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a broker account share (owner or member)' })
  async revokeShare(@Req() req: AuthReq, @Param('id') shareId: string) {
    return this.brokerService.revokeShare(req.user.userId, shareId);
  }
}
