import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StrategyBuilderService } from './strategy-builder.service';
import { BacktestService } from '../backtest/backtest.service';
import { StrategiesService } from '../strategies/strategies.service';
import {
  CreateBuilderStrategyDto,
  AddNodeDto,
  UpdateNodeDto,
  AddEdgeDto,
  RunBuilderBacktestDto,
  CodegenQueryDto,
} from './dto/builder.dto';

interface RequestWithUser extends Request {
  user: { id: string };
}

@UseGuards(JwtAuthGuard)
@Controller('builder')
export class StrategyBuilderController {
  constructor(
    private readonly builderService: StrategyBuilderService,
    private readonly backtestService: BacktestService,
    private readonly strategiesService: StrategiesService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────────

  @Post()
  create(@Req() req: RequestWithUser, @Body() dto: CreateBuilderStrategyDto) {
    return this.builderService.createStrategy(
      req.user.id,
      dto.name,
      dto.description ?? '',
      dto.category ?? 'CUSTOM',
    );
  }

  @Get()
  list(@Req() req: RequestWithUser) {
    return this.builderService.getStrategies(req.user.id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.builderService.getStrategy(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.builderService.deleteStrategy(id);
  }

  // ── Nodes ───────────────────────────────────────────────────────────────────

  @Post(':id/nodes')
  addNode(@Param('id') id: string, @Body() dto: AddNodeDto) {
    return this.builderService.addNode(
      id,
      dto.nodeType,
      dto.config ?? {},
      dto.label,
      dto.position ?? { x: 0, y: 0 },
    );
  }

  @Patch('nodes/:nodeId')
  updateNode(@Param('nodeId') nodeId: string, @Body() dto: UpdateNodeDto) {
    return this.builderService.updateNode(nodeId, dto.config, dto.label);
  }

  @Delete('nodes/:nodeId')
  removeNode(@Param('nodeId') nodeId: string) {
    return this.builderService.removeNode(nodeId);
  }

  // ── Edges ───────────────────────────────────────────────────────────────────

  @Post(':id/edges')
  addEdge(@Param('id') id: string, @Body() dto: AddEdgeDto) {
    return this.builderService.addEdge(id, dto.fromNodeId, dto.toNodeId);
  }

  @Delete('edges/:edgeId')
  removeEdge(@Param('edgeId') edgeId: string) {
    return this.builderService.removeEdge(edgeId);
  }

  // ── Compile ──────────────────────────────────────────────────────────────────

  @Post(':id/compile')
  async compile(@Param('id') id: string) {
    const builder = await this.builderService.getStrategy(id);
    if (!builder) throw new NotFoundException('Strategy builder not found');
    return this.backtestService.compileGraph(
      builder.nodes as any[],
      builder.edges as any[],
    );
  }

  // ── Backtest ─────────────────────────────────────────────────────────────────

  @Post(':id/backtest')
  async backtest(@Param('id') id: string, @Body() dto: RunBuilderBacktestDto) {
    const builder = await this.builderService.getStrategy(id);
    if (!builder) throw new NotFoundException('Strategy builder not found');
    return this.backtestService.runFromGraph(
      builder.nodes as any[],
      builder.edges as any[],
      dto.startDate,
      dto.endDate,
      dto.initialCapital ?? 10_000,
    );
  }

  // ── Codegen ───────────────────────────────────────────────────────────────────

  @Get(':id/codegen')
  async codegen(@Param('id') id: string, @Query() query: CodegenQueryDto) {
    const builder = await this.builderService.getStrategy(id);
    if (!builder) throw new NotFoundException('Strategy builder not found');
    const definition = this.backtestService.compileGraph(
      builder.nodes as any[],
      builder.edges as any[],
    );
    const format = query.format ?? 'pine';
    const code =
      format === 'mql5'
        ? this.backtestService.generateMql5(definition)
        : this.backtestService.generatePineScript(definition);
    return { format, code };
  }

  // ── Publish ───────────────────────────────────────────────────────────────────

  @Post(':id/publish')
  async publish(@Req() req: RequestWithUser, @Param('id') id: string) {
    const builder = await this.builderService.getStrategy(id);
    if (!builder) throw new NotFoundException('Strategy builder not found');
    const definition = this.backtestService.compileGraph(
      builder.nodes as any[],
      builder.edges as any[],
    );
    return this.strategiesService.create(req.user.id, {
      name: definition.name,
      description: `Published from Strategy Builder #${id}`,
      symbol: definition.symbol,
      timeframe: definition.timeframe,
      configJson: definition as any,
    } as any);
  }
}
