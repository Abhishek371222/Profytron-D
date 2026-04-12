import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch } from '@nestjs/common';
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

  @ApiOperation({ summary: 'Get institutional dashboard metrics' })
  @Get('stats')
  async getStats() {
    return this.adminService.getSystemStats();
  }

  @ApiOperation({ summary: 'List all users for management' })
  @Get('users')
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @ApiOperation({ summary: 'Suspend or activate user account' })
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body('isSuspended') isSuspended: boolean,
  ) {
    return this.adminService.updateUserStatus(id, isSuspended);
  }

  @ApiOperation({ summary: 'Update user system role' })
  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.updateUserRole(id, role);
  }

  @ApiOperation({ summary: 'Get strategy verification queue' })
  @Get('verifications')
  async getVerifications() {
    return this.adminService.getVerificationQueue();
  }

  @ApiOperation({ summary: 'Approve or reject strategy verification' })
  @Post('verifications/:id/handle')
  async handleVerification(
    @Param('id') id: string,
    @Body('approve') approve: boolean,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.handleVerification(id, approve, notes);
  }
}

