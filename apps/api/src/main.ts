import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as net from 'node:net';
import { AppModule } from './app.module';
import { winstonConfig } from './config/winston.config';
import { configureApp } from './app.setup';

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (error: NodeJS.ErrnoException) => {
      resolve(error.code === 'EADDRINUSE');
    });
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '0.0.0.0');
  });
}

async function resolveApiPort(requestedPort: number): Promise<number> {
  // In production, never silently move to a different port — fail fast so the
  // container orchestrator knows the pod failed to bind and can reschedule it.
  if (process.env.NODE_ENV === 'production') {
    return requestedPort;
  }

  const maxPortChecks = 20;
  let port = requestedPort;
  for (let i = 0; i < maxPortChecks; i += 1) {
    if (!(await isPortInUse(port))) {
      return port;
    }
    port += 1;
  }
  return requestedPort;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: WinstonModule.createLogger(winstonConfig),
  });

  configureApp(app);

  // ─── Graceful shutdown ────────────────────────────────────────────────────
  // enableShutdownHooks() causes NestJS to listen for SIGTERM / SIGINT and
  // call onModuleDestroy() / beforeApplicationShutdown() on providers.
  // This lets Prisma, Redis, and Bull flush in-flight work before the process
  // exits, preventing data loss during rolling restarts or container eviction.
  app.enableShutdownHooks();

  const requestedPort = Number(process.env.API_PORT || 4000);
  const logger = new Logger('Bootstrap');

  if (Number.isNaN(requestedPort) || requestedPort < 1 || requestedPort > 65535) {
    logger.error(`Invalid API_PORT value: "${process.env.API_PORT}". Exiting.`);
    process.exit(1);
  }

  const port = await resolveApiPort(requestedPort);
  if (port !== requestedPort) {
    logger.warn(`Port ${requestedPort} is busy, falling back to ${port}.`);
  }

  const host = process.env.API_HOST || '0.0.0.0';
  const apiPublicUrl =
    process.env.API_PUBLIC_URL ||
    `http://${host === '0.0.0.0' ? 'api' : host}:${port}`;

  await app.listen(port, host);
  logger.log(`API is running on: ${apiPublicUrl}`);

  // Only log Swagger URL in non-production to avoid advertising the docs path
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`Documentation: ${apiPublicUrl}/api/docs`);
  }
}
bootstrap();
