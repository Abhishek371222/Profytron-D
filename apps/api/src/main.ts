// Must be the first import: initialises OpenTelemetry (no-op unless enabled)
// before any instrumented library (express/pg/ioredis) is loaded.
import './tracing';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as net from 'node:net';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { winstonConfig } from './config/winston.config';
import { configureApp } from './app.setup';
import { RedisIoAdapter } from './adapters/redis-io.adapter';

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
  // "Strict" environments (production + staging) fail fast on any missing or
  // malformed variable so a broken deploy never starts serving traffic. Local
  // dev/test only logs warnings so partial configs (e.g. in-memory Redis) boot.
  const nodeEnv = process.env.NODE_ENV;
  const isStrict = nodeEnv === 'production' || nodeEnv === 'staging';

  // Always required
  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'AES_MASTER_KEY',
  ];
  // Required in strict (production/staging) environments only
  const prodRequired = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'CORS_ORIGIN',
    'FRONTEND_URL',
  ];

  const missing: string[] = [];
  const invalid: string[] = [];

  for (const key of required) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  if (isStrict) {
    for (const key of prodRequired) {
      if (!process.env[key]?.trim()) missing.push(key);
    }
    const hasRedisUrl = Boolean(process.env.REDIS_URL?.trim());
    const hasUpstash =
      Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()) &&
      Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
    if (!hasRedisUrl && !hasUpstash) {
      missing.push(
        'REDIS_URL or UPSTASH_REDIS_REST_URL+UPSTASH_REDIS_REST_TOKEN',
      );
    }
  }

  // ─── Format / strength validation (only for values that are present) ───────
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl && !/^postgres(ql)?:\/\//i.test(dbUrl)) {
    invalid.push('DATABASE_URL must be a postgres:// or postgresql:// URL');
  }

  const aesKey = process.env.AES_MASTER_KEY?.trim();
  if (aesKey && !/^[0-9a-fA-F]{64}$/.test(aesKey)) {
    invalid.push(
      "AES_MASTER_KEY must be 64 hex chars (32 bytes). Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  const accessSecret = process.env.JWT_ACCESS_SECRET ?? '';
  const refreshSecret = process.env.JWT_REFRESH_SECRET ?? '';
  const minSecretLen = isStrict ? 32 : 16;
  if (accessSecret && accessSecret.length < minSecretLen) {
    invalid.push(`JWT_ACCESS_SECRET must be ≥ ${minSecretLen} characters`);
  }
  if (refreshSecret && refreshSecret.length < minSecretLen) {
    invalid.push(`JWT_REFRESH_SECRET must be ≥ ${minSecretLen} characters`);
  }
  if (accessSecret && refreshSecret && accessSecret === refreshSecret) {
    invalid.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
  }

  const portRaw = process.env.API_PORT;
  if (portRaw !== undefined && portRaw !== '') {
    const port = Number(portRaw);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      invalid.push('API_PORT must be an integer between 1 and 65535');
    }
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    try {
      // eslint-disable-next-line no-new
      new URL(redisUrl);
    } catch {
      invalid.push('REDIS_URL must be a valid URL');
    }
  }

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
  if (invalid.length > 0) {
    logger.error(`Invalid environment variables:\n - ${invalid.join('\n - ')}`);
  }
  if ((missing.length > 0 || invalid.length > 0) && isStrict) {
    logger.error(
      'Refusing to start with an invalid configuration. Exiting (NODE_ENV=' +
        `${nodeEnv}).`,
    );
    process.exit(1);
  }

  // Warn about demo/placeholder values in strict environments
  if (isStrict) {
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

function installProcessSafetyNet() {
  const logger = new Logger('ProcessSafety');
  // Background pollers (copy-factory sync, market price broadcast, master sync)
  // run on timers and issue Prisma queries. A transient DB disconnect (e.g. Neon
  // closing an idle serverless connection — P1017) surfaces as an unhandled
  // rejection that would otherwise crash the whole API. Prisma reconnects on the
  // next query, so we log and keep the process alive instead of exiting.
  process.on('unhandledRejection', (reason) => {
    logger.error(
      `Unhandled promise rejection (process kept alive): ${
        reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)
      }`,
    );
  });
  process.on('uncaughtException', (err) => {
    logger.error(
      `Uncaught exception (process kept alive): ${err.stack ?? err.message}`,
    );
  });
}

async function bootstrap() {
  validateEnv();
  installProcessSafetyNet();

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: WinstonModule.createLogger(winstonConfig),
  });

  configureApp(app);

  // ─── WebSocket horizontal scaling ─────────────────────────────────────────
  // Attach the Redis Pub/Sub adapter when a real Redis is configured so events
  // fan out across all API replicas. No-op (default adapter) in single-instance
  // / in-memory-Redis dev.
  const redisIoAdapter = new RedisIoAdapter(app);
  if (await redisIoAdapter.connectToRedis()) {
    app.useWebSocketAdapter(redisIoAdapter);
  }

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
