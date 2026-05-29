import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

type AuthRequest = Request & { user: { id: string; role?: string } };

@ApiTags('Support')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  @Post('tickets')
  createTicket(
    @Req() req: AuthRequest,
    @Body() body: { subject: string; description: string; category: string },
  ) {
    return this.supportService.createTicket(
      req.user.id,
      body.subject,
      body.description,
      body.category,
    );
  }

  @ApiOperation({ summary: 'List your support tickets' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tickets')
  getTickets(@Req() req: AuthRequest, @Query('status') status?: string) {
    return this.supportService.getTickets(req.user.id, status);
  }

  @ApiOperation({ summary: 'Get a single support ticket' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('tickets/:id')
  getTicket(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  @ApiOperation({ summary: 'Add a response to a ticket' })
  @ApiResponse({ status: 201, description: 'Response added' })
  @Post('tickets/:id/responses')
  addResponse(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    const isAdmin =
      req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    return this.supportService.addResponse(
      id,
      req.user.id,
      body.message,
      isAdmin,
    );
  }

  @ApiOperation({ summary: 'Update ticket status (admin)' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @Patch('tickets/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.supportService.updateTicketStatus(id, body.status);
  }

  @ApiOperation({ summary: 'Assign ticket to admin' })
  @ApiResponse({ status: 200, description: 'Assigned' })
  @Patch('tickets/:id/assign')
  assignTicket(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { adminId?: string },
  ) {
    return this.supportService.assignTicket(id, body.adminId || req.user.id);
  }

  @ApiOperation({ summary: 'Get all pending tickets (admin)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('admin/pending')
  getPendingTickets() {
    return this.supportService.getPendingTickets();
  }
}
