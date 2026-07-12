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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
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
  ApiConsumes,
} from '@nestjs/swagger';
import { StrategyDocumentsService } from '../marketplace/strategy-documents.service';
import * as fs from 'fs';

@ApiTags('Strategies')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('strategies')
export class StrategiesController {
  constructor(
    private strategiesService: StrategiesService,
    private strategyDocuments: StrategyDocumentsService,
  ) {}

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

  @Get('created')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get strategies created by the current user' })
  async getCreatedStrategies(@Req() req: any) {
    return this.strategiesService.getCreatedStrategies(req.user.userId);
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

  @Post(':id/pause')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Pause an active strategy subscription' })
  async pause(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.pause(id, req.user.userId);
  }

  @Post(':id/resume')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Resume a paused strategy subscription' })
  async resume(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.resume(id, req.user.userId);
  }

  @Patch(':id/auto-renew')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Toggle auto-renewal for a strategy subscription' })
  async setAutoRenew(
    @Param('id') id: string,
    @Req() req: any,
    @Body('autoRenew') autoRenew: boolean,
  ) {
    return this.strategiesService.setAutoRenew(
      id,
      req.user.userId,
      Boolean(autoRenew),
    );
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
  @ApiOperation({
    summary: 'Submit strategy for 1-week marketplace review (pending approval)',
  })
  async publish(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.publish(id, req.user.userId);
  }

  @Post(':id/publish-live')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary: 'Publish an approved strategy to the public marketplace',
  })
  async publishLive(@Param('id') id: string, @Req() req: any) {
    return this.strategiesService.publishLive(id, req.user.userId);
  }

  @Get(':id/documents')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'List documents for a strategy (creator sees all)' })
  async listDocuments(@Param('id') id: string, @Req() req: any) {
    const strategy = await this.strategiesService.findById(id, req.user.userId);
    const isOwner = strategy?.creatorId === req.user.userId;
    return this.strategyDocuments.listDocuments(id, {
      publishedOnly: !isOwner,
    });
  }

  @Public()
  @Get(':id/documents/:documentId/file')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Download a strategy document file' })
  async downloadDocumentFile(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const local = await this.strategyDocuments.getLocalFilePath(id, documentId);
    if (local) {
      res.setHeader('Content-Type', local.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(local.title)}"`,
      );
      return fs.createReadStream(local.path).pipe(res);
    }

    const docs = await this.strategyDocuments.listDocuments(id);
    const doc = docs.find((d) => d.id === documentId);
    if (!doc?.downloadUrl) {
      throw new NotFoundException('Document file not found');
    }
    return res.redirect(doc.downloadUrl);
  }

  @Post(':id/documents')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Upload image, PDF, or data file for your bot' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      // Ceiling across all kinds — StrategyDocumentsService.uploadDocument
      // enforces the tighter per-kind limit (image 5MB, PDF/data 10MB) once
      // it knows which `kind` this upload actually is.
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadDocument(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
    @Body('description') description?: string,
    @Body('kind') kind?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Uploaded file is required');
    }
    return this.strategyDocuments.uploadDocument(id, req.user.userId, file, {
      title,
      description,
      kind: kind || 'PDF',
      isPublished: false,
      requireOwnership: true,
    });
  }

  @Delete(':id/documents/:documentId')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Delete a document from your bot' })
  async deleteDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Req() req: any,
  ) {
    const strategy = await this.strategiesService.findById(id, req.user.userId);
    if (strategy.creatorId !== req.user.userId) {
      throw new BadRequestException('Not your strategy');
    }
    await this.strategyDocuments.deleteDocument(id, documentId);
    return { ok: true };
  }
}
