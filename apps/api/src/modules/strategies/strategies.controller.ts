import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import {
  CreateStrategyDto,
  UpdateStrategyDto,
  StrategiesQueryDto,
  ActivateStrategyDto,
  RunBacktestDto,
} from './dto/strategy.dto';
import { Public, JwtAuthGuard } from '../auth/guards/auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Strategies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('strategies')
export class StrategiesController {
  constructor(private strategiesService: StrategiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all public active strategies' })
  async findAll(@Query() query: StrategiesQueryDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.strategiesService.findAll(query, userId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get strategies user is currently subscribed to' })
  async getMyStrategies(@Req() req: any) {
    return this.strategiesService.getMyStrategies(req.user.userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get strategy details' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId;
    return this.strategiesService.findById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new quant strategy' })
  async create(@Req() req: any, @Body() dto: CreateStrategyDto) {
    return this.strategiesService.create(req.user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing strategy' })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateStrategyDto,
  ) {
    return this.strategiesService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a strategy' })
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.delete(id, req.user.userId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate/Subscribe to a strategy' })
  async activate(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ActivateStrategyDto,
  ) {
    return this.strategiesService.activate(id, req.user.userId, dto);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate/Unsubscribe from a strategy' })
  async deactivate(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.deactivate(id, req.user.userId);
  }

  @Post(':id/backtest')
  @ApiOperation({ summary: 'Run a backtest for a strategy' })
  async runBacktest(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: RunBacktestDto,
  ) {
    return this.strategiesService.runBacktest(id, req.user.userId, dto);
  }

  @Post('backtest/preview')
  @ApiOperation({ summary: 'Run a backtest for a strategy config (unsaved)' })
  async previewBacktest(@Req() req: any, @Body() dto: RunBacktestDto) {
    return this.strategiesService.runBacktestPreview(req.user.userId, dto);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Mark strategy as published for review' })
  async publish(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.publish(id, req.user.userId);
  }
}
