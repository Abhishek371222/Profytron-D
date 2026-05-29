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
  async connectBroker(@Req() req: any, @Body() dto: any) {
    return this.brokerService.connectBroker(req.user.userId, dto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'Get all connected broker accounts for current user',
  })
  async getBrokerAccounts(@Req() req: any) {
    return this.brokerService.getBrokerAccounts(req.user.userId);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Disconnect an active broker account' })
  async disconnectBroker(@Req() req: any, @Param('id') accountId: string) {
    return this.brokerService.disconnectBroker(req.user.userId, accountId);
  }

  @Post(':id/test')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Run a live connection test to verify credentials' })
  async testConnection(@Req() req: any, @Param('id') accountId: string) {
    return this.brokerService.testConnection(req.user.userId, accountId);
  }
}
