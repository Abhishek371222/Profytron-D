import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { VpsService } from './vps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('VPS')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@UseGuards(JwtAuthGuard)
@Controller('vps')
export class VpsController {
  constructor(private readonly vpsService: VpsService) {}

  @Get()
  @ApiOperation({ summary: 'List all VPS accounts for current user' })
  @ApiResponse({ status: 200, description: 'OK' })
  getMyVps(@Req() req: any) {
    return this.vpsService.getVpsAccounts(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Provision a new VPS instance' })
  @ApiResponse({ status: 201, description: 'Created' })
  createVps(
    @Req() req: any,
    @Body() body: { provider: string; cpuCores?: number; memoryGb?: number },
  ) {
    return this.vpsService.createVpsAccount(req.user.id, body.provider, body);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a VPS instance' })
  @ApiResponse({ status: 200, description: 'OK' })
  startVps(@Param('id') id: string) {
    return this.vpsService.startVps(id);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop a VPS instance' })
  @ApiResponse({ status: 200, description: 'OK' })
  stopVps(@Param('id') id: string) {
    return this.vpsService.stopVps(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a VPS instance' })
  @ApiResponse({ status: 200, description: 'OK' })
  deleteVps(@Param('id') id: string) {
    return this.vpsService.deleteVps(id);
  }

  @Get(':id/bots')
  @ApiOperation({ summary: 'List bot instances on a VPS' })
  @ApiResponse({ status: 200, description: 'OK' })
  getBots(@Param('id') id: string) {
    return this.vpsService.getBotInstances(id);
  }

  @Post(':id/bots')
  @ApiOperation({ summary: 'Deploy a bot instance on a VPS' })
  @ApiResponse({ status: 201, description: 'Created' })
  createBot(
    @Param('id') id: string,
    @Body() body: { strategyId: string; name: string },
  ) {
    return this.vpsService.createBotInstance(id, body.strategyId, body.name);
  }

  @Post('bots/:botId/start')
  @ApiOperation({ summary: 'Start a bot instance' })
  @ApiResponse({ status: 200, description: 'OK' })
  startBot(@Param('botId') botId: string) {
    return this.vpsService.startBot(botId);
  }

  @Post('bots/:botId/stop')
  @ApiOperation({ summary: 'Stop a bot instance' })
  @ApiResponse({ status: 200, description: 'OK' })
  stopBot(@Param('botId') botId: string) {
    return this.vpsService.stopBot(botId);
  }
}
