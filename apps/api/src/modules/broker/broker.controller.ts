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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BrokerService } from './broker.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';

@ApiTags('Broker')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('broker/accounts')
export class BrokerController {
  constructor(private readonly brokerService: BrokerService) {}

  @Post('connect')
  @ApiOperation({
    summary: 'Connect a new broker account (secure AES storage)',
  })
  async connectBroker(@Req() req: any, @Body() dto: any) {
    return this.brokerService.connectBroker(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all connected broker accounts for current user',
  })
  async getBrokerAccounts(@Req() req: any) {
    return this.brokerService.getBrokerAccounts(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect an active broker account' })
  async disconnectBroker(@Req() req: any, @Param('id') accountId: string) {
    return this.brokerService.disconnectBroker(req.user.userId, accountId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Run a live connection test to verify credentials' })
  async testConnection(@Req() req: any, @Param('id') accountId: string) {
    return this.brokerService.testConnection(req.user.userId, accountId);
  }
}
