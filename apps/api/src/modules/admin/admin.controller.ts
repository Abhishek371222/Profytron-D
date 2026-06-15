import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Req,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { TradingService } from '../trading/trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RiskLevel, StrategyCategory, UserRole } from '@prisma/client';
import { Request } from 'express';

type AdminRequest = Request & { user: { id: string; role: string } };

@ApiTags('Admin')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden — admin only' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private tradingService: TradingService,
  ) {}

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get admin dashboard aggregate data' })
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get institutional dashboard metrics' })
  @Get('stats')
  async getStats() {
    return this.adminService.getSystemStats();
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'List all users for management' })
  @Get('users')
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Get one user detail by id' })
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Suspend or activate user account' })
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body('isSuspended') isSuspended: boolean,
  ) {
    return this.adminService.updateUserStatus(id, isSuspended);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Update user system role' })
  @Patch('users/:id/role')
  async updateUserRole(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.updateUserRole(id, role, req.user.id);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get strategy verification queue' })
  @Get('verifications')
  async getVerifications() {
    return this.adminService.getVerificationQueue();
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get all strategies for admin management' })
  @Get('strategies')
  async getStrategies() {
    return this.adminService.getStrategies();
  }

  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Create a strategy from admin panel' })
  @Post('strategies')
  async createStrategy(
    @Req() req: AdminRequest,
    @Body('creatorId') creatorId: string,
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('category') category: StrategyCategory,
    @Body('riskLevel') riskLevel: RiskLevel,
    @Body('configJson') configJson?: unknown,
    @Body('monthlyPrice') monthlyPrice?: number,
    @Body('annualPrice') annualPrice?: number,
    @Body('lifetimePrice') lifetimePrice?: number,
    @Body('maxCopies') maxCopies?: number,
    @Body('isFeatured') isFeatured?: boolean,
    @Body('isPublished') isPublished?: boolean,
    @Body('isVerified') isVerified?: boolean,
    @Body('trialDays') trialDays?: number,
    @Body('creatorSharePct') creatorSharePct?: number,
    @Body('platformSharePct') platformSharePct?: number,
    @Body('payoutEnabled') payoutEnabled?: boolean,
  ) {
    return this.adminService.createStrategy(
      {
        creatorId,
        name,
        description,
        category,
        riskLevel,
        configJson: (configJson ?? {}) as any,
        monthlyPrice:
          monthlyPrice !== undefined ? Number(monthlyPrice) : undefined,
        annualPrice:
          annualPrice !== undefined ? Number(annualPrice) : undefined,
        lifetimePrice:
          lifetimePrice !== undefined ? Number(lifetimePrice) : undefined,
        maxCopies: maxCopies !== undefined ? Number(maxCopies) : undefined,
        isFeatured,
        isPublished,
        isVerified,
        trialDays: trialDays !== undefined ? Number(trialDays) : undefined,
        creatorSharePct:
          creatorSharePct !== undefined ? Number(creatorSharePct) : undefined,
        platformSharePct:
          platformSharePct !== undefined ? Number(platformSharePct) : undefined,
        payoutEnabled,
      },
      req.user.id,
    );
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Update a strategy from admin panel' })
  @Patch('strategies/:id')
  async updateStrategy(
    @Req() req: AdminRequest,
    @Param('id') strategyId: string,
    @Body('creatorId') creatorId?: string,
    @Body('name') name?: string,
    @Body('description') description?: string,
    @Body('category') category?: StrategyCategory,
    @Body('riskLevel') riskLevel?: RiskLevel,
    @Body('configJson') configJson?: unknown,
    @Body('monthlyPrice') monthlyPrice?: number,
    @Body('annualPrice') annualPrice?: number,
    @Body('lifetimePrice') lifetimePrice?: number,
    @Body('maxCopies') maxCopies?: number,
    @Body('isFeatured') isFeatured?: boolean,
    @Body('isPublished') isPublished?: boolean,
    @Body('isVerified') isVerified?: boolean,
    @Body('trialDays') trialDays?: number,
    @Body('creatorSharePct') creatorSharePct?: number,
    @Body('platformSharePct') platformSharePct?: number,
    @Body('payoutEnabled') payoutEnabled?: boolean,
  ) {
    return this.adminService.updateStrategy(
      strategyId,
      {
        creatorId,
        name,
        description,
        category,
        riskLevel,
        configJson: configJson as any,
        monthlyPrice:
          monthlyPrice !== undefined ? Number(monthlyPrice) : undefined,
        annualPrice:
          annualPrice !== undefined ? Number(annualPrice) : undefined,
        lifetimePrice:
          lifetimePrice !== undefined ? Number(lifetimePrice) : undefined,
        maxCopies: maxCopies !== undefined ? Number(maxCopies) : undefined,
        isFeatured,
        isPublished,
        isVerified,
        trialDays: trialDays !== undefined ? Number(trialDays) : undefined,
        creatorSharePct:
          creatorSharePct !== undefined ? Number(creatorSharePct) : undefined,
        platformSharePct:
          platformSharePct !== undefined ? Number(platformSharePct) : undefined,
        payoutEnabled,
      },
      req.user.id,
    );
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary: 'Parse strategy PDF to auto-fill admin strategy data',
  })
  @Post('strategies/pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max — prevents memory exhaustion from large PDFs
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          cb(new BadRequestException('Only PDF files are supported'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async parseStrategyPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Uploaded file is required');
    }
    return this.adminService.parseStrategyPdf(file);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Delete a strategy from admin panel' })
  @Delete('strategies/:id')
  async deleteStrategy(@Param('id') strategyId: string) {
    return this.adminService.deleteStrategy(strategyId);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Approve or reject strategy verification' })
  @Post('verifications/:id/handle')
  async handleVerification(
    @Param('id') id: string,
    @Body('approve') approve: boolean,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.handleVerification(id, approve, notes);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get payments summary for admin billing console' })
  @Get('payments/overview')
  async getPaymentsOverview() {
    return this.adminService.getPaymentsOverview();
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'Get live system metrics for ops dashboard' })
  @Get('system/metrics')
  async getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  @ApiResponse({ status: 200, description: 'Master copy trading provisioned' })
  @ApiOperation({
    summary:
      'Connect admin MT5 from env, mark master, publish marketplace copy strategy',
  })
  @Post('setup/master-copy')
  async provisionMasterCopy() {
    return this.adminService.provisionMasterCopyTrading();
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({
    summary: 'List broker accounts for master copy-trade control',
  })
  @Get('broker-accounts')
  async getBrokerAccounts() {
    return this.adminService.getBrokerAccounts();
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiOperation({ summary: 'Mark broker account as a master source' })
  @Patch('broker-accounts/:id/master')
  async setBrokerMasterSource(
    @Param('id') id: string,
    @Body('isMasterSource') isMasterSource: boolean,
  ) {
    return this.adminService.setBrokerMasterSource(id, isMasterSource);
  }

  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({
    summary: 'Broadcast a master-account signal to subscribed users',
  })
  @Post('broker-accounts/:id/broadcast')
  async broadcastMasterSignal(
    @Param('id') sourceBrokerAccountId: string,
    @Body('strategyId') strategyId: string,
    @Body('signalType') signalType: string,
    @Body('pair') pair: string,
    @Body('price') price: number,
  ) {
    return this.tradingService.broadcastMasterSignal({
      sourceBrokerAccountId,
      strategyId,
      signalType,
      pair,
      price: Number(price),
    });
  }

  @Get('kyc/pending')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiOperation({ summary: 'List users with pending KYC submissions' })
  async getPendingKyc() {
    return this.adminService.getPendingKyc();
  }

  @Post('kyc/:userId/review')
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiOperation({ summary: 'Approve or reject a user KYC submission' })
  async reviewKyc(
    @Req() req: AdminRequest,
    @Param('userId') userId: string,
    @Body('approve') approve: boolean,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.reviewKyc(userId, approve, notes, req.user.id);
  }
}
