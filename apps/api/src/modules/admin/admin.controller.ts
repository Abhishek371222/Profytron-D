import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

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
}

