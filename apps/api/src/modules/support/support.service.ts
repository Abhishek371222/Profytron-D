import {
  Injectable,
  Logger,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { appError, ErrorCode } from '../../common/errors';
import { AgentEventService } from '../agents/agent-event.service';
import { AGENT_EVENTS } from '../agents/agent.types';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private agentEvents: AgentEventService,
  ) {}

  async createTicket(
    userId: string,
    subject: string,
    description: string,
    category: string,
  ) {
    return this.prisma.supportTicket
      .create({
        data: {
          userId,
          subject,
          description,
          category,
          status: 'OPEN',
          priority: 'MEDIUM',
        },
      })
      .then(async (ticket) => {
        void this.agentEvents.emit({
          type: AGENT_EVENTS.SUPPORT_TICKET_CREATED,
          entityType: 'ticket',
          entityId: ticket.id,
          userId,
          payload: {
            subject,
            category,
            description: description.slice(0, 500),
          },
          idempotencyKey: `ticket:${ticket.id}`,
        });
        return ticket;
      });
  }

  async getTickets(userId: string, status?: string) {
    return this.prisma.supportTicket.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      include: { responses: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicket(ticketId: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        responses: {
          include: { user: { select: { fullName: true, avatarUrl: true } } },
        },
      },
    });
  }

  async addResponse(
    ticketId: string,
    userId: string,
    message: string,
    isAdmin = false,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket)
      appError(
        HttpStatus.NOT_FOUND,
        'Ticket not found',
        ErrorCode.VALIDATION_ERROR,
      );

    // Only the ticket owner or admins can respond
    if (!isAdmin && ticket.userId !== userId) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    return this.prisma.supportTicketResponse
      .create({
        data: { ticketId, userId, message, isAdmin },
      })
      .then(async (response) => {
        if (!isAdmin) {
          void this.agentEvents.emit({
            type: AGENT_EVENTS.SUPPORT_MESSAGE_RECEIVED,
            entityType: 'ticket',
            entityId: ticketId,
            userId,
            payload: {
              message: message.slice(0, 500),
              responseId: response.id,
            },
            idempotencyKey: `ticket-msg:${response.id}`,
          });
        }
        return response;
      });
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const statusMap: any = {
      OPEN: 'OPEN',
      IN_PROGRESS: 'IN_PROGRESS',
      RESOLVED: 'RESOLVED',
      CLOSED: 'CLOSED',
    };

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: statusMap[status] || 'OPEN',
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
    });
  }

  async assignTicket(ticketId: string, adminId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedToId: adminId },
    });
  }

  async getPendingTickets() {
    return this.prisma.supportTicket.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      orderBy: { priority: 'desc' },
    });
  }
}
