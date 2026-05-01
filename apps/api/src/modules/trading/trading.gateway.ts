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

const wsAllowedOrigins = (
  process.env.CORS_ORIGIN || process.env.FRONTEND_URL || ''
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
  private connectedClients: Map<string, string> = new Map(); // socketId -> userId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth.token || client.handshake.headers.authorization;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token.replace('Bearer ', ''), {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      this.connectedClients.set(client.id, payload.sub);
      client.join(`user:${payload.sub}`);
      this.logger.log(`User ${payload.sub} connected`);
    } catch (e) {
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
  }

  broadcastPrices(prices: any) {
    this.server.to('market_prices').emit('price_update', prices);
  }
}
