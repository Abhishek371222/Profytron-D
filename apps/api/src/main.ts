import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as net from 'node:net';
import type { Request, Response } from 'express';
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

function validateEnv() {
  const logger = new Logger('EnvValidation');
  const isProduction = process.env.NODE_ENV === 'production';

  // Always required
  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'AES_MASTER_KEY',
  ];
  // Required in production only
  const prodRequired = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'CORS_ORIGIN',
    'FRONTEND_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];

  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key]) missing.push(key);
  }
  if (isProduction) {
    for (const key of prodRequired) {
      if (!process.env[key]) missing.push(key);
    }
  }

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
    if (isProduction) process.exit(1);
  }

  // Warn about demo/placeholder values in production
  if (isProduction) {
    if (!process.env.METAAPI_TOKEN) {
      logger.warn(
        'METAAPI_TOKEN is not set — all broker trades will be mocked',
      );
    }
    if (process.env.RAZORPAY_KEY_ID === 'DEMO_KEY') {
      logger.warn(
        'RAZORPAY_KEY_ID is still set to DEMO_KEY — Razorpay payments will fail',
      );
    }
    if ((process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_')) {
      logger.warn(
        'STRIPE_SECRET_KEY is a test key — switch to live key for production',
      );
    }
    if (!process.env.MASTER_BROKER_ACCOUNT_ID) {
      logger.warn(
        'MASTER_BROKER_ACCOUNT_ID not set — copy trading master sync is disabled',
      );
    }
  }
}

async function bootstrap() {
  validateEnv();

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

  if (
    Number.isNaN(requestedPort) ||
    requestedPort < 1 ||
    requestedPort > 65535
  ) {
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

  // ─── Root path handler ───────────────────────────────────────────────────
  // NestJS global prefix is `/v1`, so the NestJS AppController's @Get() maps
  // to `/v1`, not `/`. Register a raw Express route before NestJS takes over
  // so that GET / returns a proper JSON status response instead of a 404.
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

  await app.listen(port, host);
  logger.log(`API is running on: ${apiPublicUrl}`);

  // Only log Swagger URL in non-production to avoid advertising the docs path
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`Documentation: ${apiPublicUrl}/api/docs`);
  }
}
bootstrap();
