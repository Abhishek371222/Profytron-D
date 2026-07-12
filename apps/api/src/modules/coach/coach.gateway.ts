import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../auth/redis.service';

const wsAllowedOrigins = (
  process.env.CORS_ORIGIN ||
  process.env.FRONTEND_URL ||
  ''
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: wsAllowedOrigins.length > 0 ? wsAllowedOrigins : false,
    credentials: true,
  },
  namespace: 'coach',
})
export class CoachGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CoachGateway.name);
  private connectedClients = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const raw =
      client.handshake.auth.token || client.handshake.headers.authorization;
    if (!raw) {
      client.disconnect();
      return;
    }

    try {
      const token = (raw as string).replace('Bearer ', '');
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
        algorithms: ['HS256'],
      });

      if (payload.jti) {
        const isBlacklisted = await this.redisService.exists(
          `auth:blacklist:${payload.jti}`,
        );
        if (isBlacklisted) {
          client.disconnect();
          return;
        }
      }

      const userId = payload.sub as string;
      this.connectedClients.set(client.id, userId);
      client.join(`user:${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role === 'ADMIN') {
        client.join('admin:coach');
      }

      this.logger.log(`Coach WS connected: ${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const conversationId = body?.conversationId;
    if (!conversationId) return { ok: false };
    client.join(`conversation:${conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { conversationId?: string; isTyping?: boolean },
  ) {
    const userId = this.connectedClients.get(client.id);
    if (!userId || !body?.conversationId) return;
    this.server.to(`conversation:${body.conversationId}`).emit('typing', {
      conversationId: body.conversationId,
      userId,
      isTyping: Boolean(body.isTyping),
    });
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    try {
      this.server?.to(`user:${userId}`).emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`emitToUser failed: ${err?.message || err}`);
    }
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    try {
      this.server?.to(`conversation:${conversationId}`).emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`emitToConversation failed: ${err?.message || err}`);
    }
  }

  emitToAdmins(event: string, payload: unknown) {
    try {
      this.server?.to('admin:coach').emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`emitToAdmins failed: ${err?.message || err}`);
    }
  }
}
