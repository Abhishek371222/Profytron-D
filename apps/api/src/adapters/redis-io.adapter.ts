import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import {
  getRedisConnectionUrl,
  getRedisClientOptions,
  isInMemoryRedis,
} from '../config/redis.config';

/**
 * Socket.IO adapter backed by Redis Pub/Sub so WebSocket events fan out across
 * every API replica (required for horizontal scaling — without it, a client
 * connected to replica A never receives events emitted from replica B).
 *
 * Falls back to the default in-memory adapter when Redis is in-memory (local
 * dev) or unavailable, so single-instance setups are unaffected.
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<boolean> {
    if (isInMemoryRedis()) return false;

    const url = getRedisConnectionUrl();
    if (!url) return false;

    try {
      const options = getRedisClientOptions();
      const pubClient = new Redis(url, options);
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) =>
        this.logger.warn(`Socket.IO pub client error: ${err.message}`),
      );
      subClient.on('error', (err) =>
        this.logger.warn(`Socket.IO sub client error: ${err.message}`),
      );

      // Verify the wire protocol before attaching — a REST/HTTPS URL yields
      // "Protocol error, got H" and would otherwise spam errors forever.
      await pubClient.ping();

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log(
        'Socket.IO Redis adapter enabled (multi-instance pub/sub fan-out)',
      );
      return true;
    } catch (err) {
      this.logger.warn(
        `Socket.IO Redis adapter disabled, using in-memory: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return false;
    }
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
