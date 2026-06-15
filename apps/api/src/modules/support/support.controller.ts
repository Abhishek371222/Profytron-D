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
  ForbiddenException,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateTicketDto,
  AddResponseDto,
  UpdateStatusDto,
  AssignTicketDto,
} from './dto/support.dto';
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
  createTicket(@Req() req: AuthRequest, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(
      req.user.id,
      dto.subject,
      dto.description,
      dto.category,
    );
  }

  @ApiOperation({ summary: 'List your support tickets' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tickets')
  getTickets(@Req() req: AuthRequest, @Query('status') status?: string) {
    return this.supportService.getTickets(req.user.id, status);
  }

  @ApiOperation({ summary: 'Get a single support ticket (own tickets only)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('tickets/:id')
  async getTicket(@Req() req: AuthRequest, @Param('id') id: string) {
    const isAdmin =
      req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const ticket = await this.supportService.getTicket(id);
    if (!ticket) return null;
    if (!isAdmin && ticket.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this ticket');
    }
    return ticket;
  }

  @ApiOperation({ summary: 'Add a response to a ticket' })
  @ApiResponse({ status: 201, description: 'Response added' })
  @Post('tickets/:id/responses')
  addResponse(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: AddResponseDto,
  ) {
    const isAdmin =
      req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    return this.supportService.addResponse(id, req.user.id, dto.message, isAdmin);
  }

  @ApiOperation({ summary: 'Update ticket status (admin only)' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch('tickets/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.supportService.updateTicketStatus(id, dto.status);
  }

  @ApiOperation({ summary: 'Assign ticket to admin (admin only)' })
  @ApiResponse({ status: 200, description: 'Assigned' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch('tickets/:id/assign')
  assignTicket(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(id, dto.adminId || req.user.id);
  }

  @ApiOperation({ summary: 'Get all pending tickets (admin only)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('admin/pending')
  getPendingTickets() {
    return this.supportService.getPendingTickets();
  }
}
