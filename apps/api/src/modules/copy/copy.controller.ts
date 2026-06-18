import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, Public } from '../auth/guards/auth.guard';
import { CopyTradingService } from './copy.service';
import { SetSizingDto, UpsertMasterProfileDto } from './dto/copy.dto';

interface RequestWithUser {
  user: { id: string; userId?: string };
}

const uid = (req: RequestWithUser) => req.user.userId ?? req.user.id;

@ApiTags('Copy Trading')
@Controller('copy')
export class CopyController {
  constructor(private readonly copyService: CopyTradingService) {}

  // ─── Public master discovery ───────────────────────────────────────────────

  @Public()
  @Get('masters')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'List public master traders (leaderboard).' })
  async listMasters(@Query('limit') limit?: string) {
    return this.copyService.listPublicMasters(limit ? Number(limit) : 50);
  }

  @Public()
  @Get('masters/:id')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Get a public master trader profile.' })
  async getMaster(@Param('id') id: string) {
    return this.copyService.getMaster(id);
  }

  // ─── Authenticated master profile management ───────────────────────────────

  @Get('master/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get your own master trader profile (if any).' })
  async getMyMaster(@Req() req: RequestWithUser) {
    return this.copyService.getMyMaster(uid(req));
  }

  @Put('master/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Create or update your master trader profile.' })
  async upsertMyMaster(
    @Req() req: RequestWithUser,
    @Body() dto: UpsertMasterProfileDto,
  ) {
    return this.copyService.upsertMyMaster(uid(req), dto);
  }

  // ─── Follower relationships + sizing ───────────────────────────────────────

  @Get('relationships')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'List the copy relationships you follow.' })
  async myRelationships(@Req() req: RequestWithUser) {
    return this.copyService.getMyRelationships(uid(req));
  }

  @Put('subscriptions/:id/sizing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({
    summary:
      'Set the lot-sizing method for a copy subscription (fixed / multiplier / equity-ratio).',
  })
  async setSizing(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: SetSizingDto,
  ) {
    return this.copyService.setSizing(uid(req), id, dto);
  }
}
