import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { appError, ErrorCode } from '../../common/errors';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private prisma: PrismaService) {}

  async createTicket(userId: string, subject: string, description: string, category: string) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject,
        description,
        category,
        status: 'OPEN',
        priority: 'MEDIUM',
      },
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
      include: { responses: { include: { user: { select: { fullName: true, avatarUrl: true } } } } },
    });
  }

  async addResponse(ticketId: string, userId: string, message: string, isAdmin = false) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) appError(HttpStatus.NOT_FOUND, 'Ticket not found', ErrorCode.VALIDATION_ERROR);

    return this.prisma.supportTicketResponse.create({
      data: { ticketId, userId, message, isAdmin },
    });
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const statusMap: any = {
      'OPEN': 'OPEN',
      'IN_PROGRESS': 'IN_PROGRESS',
      'RESOLVED': 'RESOLVED',
      'CLOSED': 'CLOSED',
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
