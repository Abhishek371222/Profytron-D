import {
  Injectable,
  Logger,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { appError, ErrorCode } from '../../common/errors';
import { AgentEventService } from '../agents/agent-event.service';
import { AGENT_EVENTS } from '../agents/agent.types';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private agentEvents: AgentEventService,
    private emailService: EmailService,
  ) {}

  async createTicket(
    userId: string,
    subject: string,
    description: string,
    category: string,
    billingId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) {
      appError(
        HttpStatus.NOT_FOUND,
        'User not found',
        ErrorCode.USER_NOT_FOUND,
      );
    }

    let linkedBillingId: string | undefined;
    if (billingId) {
      const normalized = billingId.trim().toUpperCase();
      const walletTxn = await this.prisma.walletTransaction.findUnique({
        where: { billingId: normalized },
        select: { id: true, userId: true, billingId: true },
      });
      if (!walletTxn) {
        appError(
          HttpStatus.BAD_REQUEST,
          'Invalid Billing ID — no matching payment found',
          ErrorCode.TRANSACTION_NOT_FOUND,
        );
      }
      if (walletTxn.userId !== userId) {
        throw new ForbiddenException(
          'Billing ID does not belong to this account',
        );
      }
      linkedBillingId = walletTxn.billingId;
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject,
        description,
        category,
        status: 'OPEN',
        priority: category === 'billing' ? 'HIGH' : 'MEDIUM',
        ...(linkedBillingId ? { billingId: linkedBillingId } : {}),
      },
      include: {
        walletTxn: {
          select: {
            id: true,
            billingId: true,
            amount: true,
            status: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });

    void this.agentEvents.emit({
      type: AGENT_EVENTS.SUPPORT_TICKET_CREATED,
      entityType: 'ticket',
      entityId: ticket.id,
      userId,
      payload: {
        subject,
        category,
        billingId: linkedBillingId ?? null,
        description: description.slice(0, 500),
      },
      idempotencyKey: `ticket:${ticket.id}`,
    });

    try {
      await this.emailService.sendSupportTicketEmail({
        ticketId: ticket.id,
        subject,
        description: linkedBillingId
          ? `${description}\n\nBilling ID: ${linkedBillingId}`
          : description,
        category,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to email support inbox for ticket ${ticket.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }

    return ticket;
  }

  async getTickets(userId: string, status?: string) {
    return this.prisma.supportTicket.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      include: {
        responses: true,
        walletTxn: {
          select: {
            id: true,
            billingId: true,
            amount: true,
            status: true,
            type: true,
            paymentCategory: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      // Hard cap — this endpoint was previously fully unbounded per user.
      take: 200,
    });
  }

  async getTicket(ticketId: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        responses: {
          include: { user: { select: { fullName: true, avatarUrl: true } } },
        },
        walletTxn: {
          select: {
            id: true,
            billingId: true,
            amount: true,
            status: true,
            type: true,
            paymentCategory: true,
            senderAddress: true,
            receiverAddress: true,
            externalTxnId: true,
            createdAt: true,
          },
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
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        walletTxn: {
          select: {
            id: true,
            billingId: true,
            amount: true,
            status: true,
            type: true,
            paymentCategory: true,
            createdAt: true,
          },
        },
      },
      orderBy: { priority: 'desc' },
    });
  }

  async getPaymentByBillingId(billingId: string) {
    const normalized = billingId.trim().toUpperCase();
    const tx = await this.prisma.walletTransaction.findUnique({
      where: { billingId: normalized },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
        supportTickets: {
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!tx) {
      appError(
        HttpStatus.NOT_FOUND,
        'No payment found for this Billing ID',
        ErrorCode.TRANSACTION_NOT_FOUND,
      );
    }
    return {
      billingId: tx.billingId,
      transactionId: tx.id,
      type: tx.type,
      status: tx.status,
      amount: tx.amount,
      paymentCategory: tx.paymentCategory,
      senderAddress: tx.senderAddress,
      receiverAddress: tx.receiverAddress,
      externalTxnId: tx.externalTxnId,
      description: tx.description,
      createdAt: tx.createdAt,
      user: tx.user,
      relatedTickets: tx.supportTickets,
    };
  }
}
