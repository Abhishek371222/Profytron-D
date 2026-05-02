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
  WalkForwardValidationDto,
  SensitivityAnalysisDto,
} from './dto/strategy.dto';
import { Public, JwtAuthGuard } from '../auth/guards/auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Strategies')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('strategies')
export class StrategiesController {
  constructor(private strategiesService: StrategiesService) {}

  @Public()
  @Get()
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'List all public active strategies' })
  async findAll(@Query() query: StrategiesQueryDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.strategiesService.findAll(query, userId);
  }

  @Get('my')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get strategies user is currently subscribed to' })
  async getMyStrategies(@Req() req: any) {
    return this.strategiesService.getMyStrategies(req.user.userId);
  }

  @Public()
  @Get(':id')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Get strategy details' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId;
    return this.strategiesService.findById(id, userId);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Create a new quant strategy' })
  async create(@Req() req: any, @Body() dto: CreateStrategyDto) {
    return this.strategiesService.create(req.user.userId, dto);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Update an existing strategy' })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateStrategyDto,
  ) {
    return this.strategiesService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Soft delete a strategy' })
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.delete(id, req.user.userId);
  }

  @Post(':id/activate')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Activate/Subscribe to a strategy' })
  async activate(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ActivateStrategyDto,
  ) {
    return this.strategiesService.activate(id, req.user.userId, dto);
  }

  @Post(':id/deactivate')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Deactivate/Unsubscribe from a strategy' })
  async deactivate(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.deactivate(id, req.user.userId);
  }

  @Post(':id/backtest')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Run a backtest for a strategy' })
  async runBacktest(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: RunBacktestDto,
  ) {
    return this.strategiesService.runBacktest(id, req.user.userId, dto);
  }

  @Post('backtest/preview')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Run a backtest for a strategy config (unsaved)' })
  async previewBacktest(@Req() req: any, @Body() dto: RunBacktestDto) {
    return this.strategiesService.runBacktestPreview(req.user.userId, dto);
  }

  @Post(':id/backtest/walk-forward')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Run walk-forward validation for a strategy' })
  async walkForwardValidation(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: WalkForwardValidationDto,
  ) {
    return this.strategiesService.runWalkForwardValidation(
      id,
      req.user.userId,
      dto,
    );
  }

  @Post(':id/backtest/sensitivity')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Run parameter sensitivity analysis' })
  async sensitivityAnalysis(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: SensitivityAnalysisDto,
  ) {
    return this.strategiesService.runSensitivityAnalysis(
      id,
      req.user.userId,
      dto,
    );
  }

  @Post(':id/publish')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Mark strategy as published for review' })
  async publish(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.publish(id, req.user.userId);
  }
}
