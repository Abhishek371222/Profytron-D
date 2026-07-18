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
