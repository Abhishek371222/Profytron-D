import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
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
  namespace: 'trading',
})
export class TradingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TradingGateway.name);
  private connectedClients: Map<string, string> = new Map();
  private lastPriceSnapshot: unknown[] | null = null;

  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
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

      this.connectedClients.set(client.id, payload.sub as string);
      client.join(`user:${payload.sub}`);
      this.logger.log(`User ${payload.sub as string} connected`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  @SubscribeMessage('subscribe_prices')
  handlePriceSubscription(client: Socket) {
    client.join('market_prices');
    if (this.lastPriceSnapshot) {
      client.emit('price_update', this.lastPriceSnapshot);
    }
  }

  @SubscribeMessage('unsubscribe_prices')
  handlePriceUnsubscription(client: Socket) {
    client.leave('market_prices');
  }

  setPriceSnapshot(snapshot: unknown[]) {
    this.lastPriceSnapshot = snapshot;
  }

  broadcastPrices(prices: any) {
    // Skip identical reference re-broadcasts (API Phase 2 WS optimization)
    if (prices === this.lastPriceSnapshot) return;
    this.lastPriceSnapshot = prices;
    this.server.to('market_prices').emit('price_update', prices);
  }
}
