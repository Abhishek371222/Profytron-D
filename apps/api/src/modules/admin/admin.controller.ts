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
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { TradingService } from '../trading/trading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RiskLevel, StrategyCategory, UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private tradingService: TradingService,
  ) {}

  private assertAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @ApiOperation({ summary: 'Get admin dashboard aggregate data' })
  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    this.assertAdmin(req);
    return this.adminService.getDashboard();
  }

  @ApiOperation({ summary: 'Get institutional dashboard metrics' })
  @Get('stats')
  async getStats(@Req() req: any) {
    this.assertAdmin(req);
    return this.adminService.getSystemStats();
  }

  @ApiOperation({ summary: 'List all users for management' })
  @Get('users')
  async getUsers(@Req() req: any) {
    this.assertAdmin(req);
    return this.adminService.getAllUsers();
  }

  @ApiOperation({ summary: 'Get one user detail by id' })
  @Get('users/:id')
  async getUserById(@Req() req: any, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.adminService.getUserDetail(id);
  }

  @ApiOperation({ summary: 'Suspend or activate user account' })
  @Patch('users/:id/status')
  async updateUserStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('isSuspended') isSuspended: boolean,
  ) {
    this.assertAdmin(req);
    return this.adminService.updateUserStatus(id, isSuspended);
  }

  @ApiOperation({ summary: 'Update user system role' })
  @Patch('users/:id/role')
  async updateUserRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    this.assertAdmin(req);
    return this.adminService.updateUserRole(id, role);
  }

  @ApiOperation({ summary: 'Get strategy verification queue' })
  @Get('verifications')
  async getVerifications(@Req() req: any) {
    this.assertAdmin(req);
    return this.adminService.getVerificationQueue();
  }

  @ApiOperation({ summary: 'Get all strategies for admin management' })
  @Get('strategies')
  async getStrategies(@Req() req: any) {
    this.assertAdmin(req);
    return this.adminService.getStrategies();
  }

  @ApiOperation({ summary: 'Create a strategy from admin panel' })
  @Post('strategies')
  async createStrategy(
    @Req() req: any,
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
    this.assertAdmin(req);
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

  @ApiOperation({ summary: 'Update a strategy from admin panel' })
  @Patch('strategies/:id')
  async updateStrategy(
    @Req() req: any,
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
    this.assertAdmin(req);
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

  @ApiOperation({ summary: 'Parse strategy PDF to auto-fill admin strategy data' })
  @Post('strategies/pdf')
  @UseInterceptors(FileInterceptor('file'))
  async parseStrategyPdf(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    this.assertAdmin(req);
    if (!file) {
      throw new BadRequestException('Uploaded file is required');
    }
    if (!file.mimetype?.includes('pdf')) {
      throw new BadRequestException('Only PDF files are supported');
    }
    return this.adminService.parseStrategyPdf(file);
  }

  @ApiOperation({ summary: 'Delete a strategy from admin panel' })
  @Delete('strategies/:id')
  async deleteStrategy(@Req() req: any, @Param('id') strategyId: string) {
    this.assertAdmin(req);
    return this.adminService.deleteStrategy(strategyId);
  }

  @ApiOperation({ summary: 'Approve or reject strategy verification' })
  @Post('verifications/:id/handle')
  async handleVerification(
    @Req() req: any,
    @Param('id') id: string,
    @Body('approve') approve: boolean,
    @Body('notes') notes?: string,
  ) {
    this.assertAdmin(req);
    return this.adminService.handleVerification(id, approve, notes);
  }

  @ApiOperation({ summary: 'Get payments summary for admin billing console' })
  @Get('payments/overview')
  async getPaymentsOverview(@Req() req: any) {
    this.assertAdmin(req);
    return this.adminService.getPaymentsOverview();
  }

  @ApiOperation({ summary: 'Get live system metrics for ops dashboard' })
  @Get('system/metrics')
  async getSystemMetrics(@Req() req: any) {
    this.assertAdmin(req);
    return this.adminService.getSystemMetrics();
  }

  @ApiOperation({
    summary: 'List broker accounts for master copy-trade control',
  })
  @Get('broker-accounts')
  async getBrokerAccounts(@Req() req: any) {
    this.assertAdmin(req);
    return this.adminService.getBrokerAccounts();
  }

  @ApiOperation({ summary: 'Mark broker account as a master source' })
  @Patch('broker-accounts/:id/master')
  async setBrokerMasterSource(
    @Req() req: any,
    @Param('id') id: string,
    @Body('isMasterSource') isMasterSource: boolean,
  ) {
    this.assertAdmin(req);
    return this.adminService.setBrokerMasterSource(id, isMasterSource);
  }

  @ApiOperation({
    summary: 'Broadcast a master-account signal to subscribed users',
  })
  @Post('broker-accounts/:id/broadcast')
  async broadcastMasterSignal(
    @Req() req: any,
    @Param('id') sourceBrokerAccountId: string,
    @Body('strategyId') strategyId: string,
    @Body('signalType') signalType: string,
    @Body('pair') pair: string,
    @Body('price') price: number,
  ) {
    this.assertAdmin(req);
    return this.tradingService.broadcastMasterSignal({
      sourceBrokerAccountId,
      strategyId,
      signalType,
      pair,
      price: Number(price),
    });
  }
}
