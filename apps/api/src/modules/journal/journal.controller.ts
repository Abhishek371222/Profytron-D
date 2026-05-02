import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { TradingJournalService } from './trading-journal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Journal')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@UseGuards(JwtAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: TradingJournalService) {}

  @Get()
  @ApiOperation({ summary: 'List trade journal entries' })
  @ApiResponse({ status: 200, description: 'OK' })
  getEntries(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    return this.journalService.getJournalEntries(
      req.user.id,
      Number(limit || 50),
      Number(skip || 0),
    );
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get emotional pattern insights from journal' })
  @ApiResponse({ status: 200, description: 'OK' })
  getInsights(@Req() req: any) {
    return this.journalService.getInsights(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new journal entry for a trade' })
  @ApiResponse({ status: 201, description: 'Created' })
  createEntry(
    @Req() req: any,
    @Body()
    body: { tradeId: string; emotions?: string; lessonLearned?: string },
  ) {
    return this.journalService.createJournalEntry(
      req.user.id,
      body.tradeId,
      body.emotions,
      body.lessonLearned,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  @ApiResponse({ status: 200, description: 'OK' })
  updateEntry(@Param('id') id: string, @Body() body: any) {
    return this.journalService.updateJournalEntry(id, body);
  }

  @Patch(':id/rate')
  @ApiOperation({ summary: 'Rate a journal entry (1-5 stars)' })
  @ApiResponse({ status: 200, description: 'OK' })
  rateEntry(@Param('id') id: string, @Body() body: { rating: number }) {
    return this.journalService.rateEntry(id, body.rating);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Run AI analysis on a journal entry' })
  @ApiResponse({ status: 200, description: 'OK' })
  analyzeEntry(@Param('id') id: string) {
    return this.journalService.generateAiAnalysis(id);
  }
}
