import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'trading',
})
export class TradingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

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
      console.log(`[WS] User ${payload.sub} connected`);
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }

  // Helper to send updates to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Broadcaster for global prices
  @SubscribeMessage('subscribe_prices')
  handlePriceSubscription(client: Socket) {
    client.join('market_prices');
  }

  broadcastPrices(prices: any) {
    this.server.to('market_prices').emit('price_update', prices);
  }
}
