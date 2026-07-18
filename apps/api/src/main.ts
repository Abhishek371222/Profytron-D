import './datadog';
import './instrument';
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
  const nodeEnv = process.env.NODE_ENV;
  const isStrict = nodeEnv === 'production' || nodeEnv === 'staging';

  const required = [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'AES_MASTER_KEY',
  ];
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

  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl && !/^postgres(ql)?:\/\//i.test(dbUrl)) {
    invalid.push('DATABASE_URL must be a postgres:// or postgresql:// URL');
  }

  const directUrl = process.env.DIRECT_URL?.trim();
  if (directUrl && !/^postgres(ql)?:\/\//i.test(directUrl)) {
    invalid.push('DIRECT_URL must be a postgres:// or postgresql:// URL');
  }
  if (
    isStrict &&
    dbUrl &&
    directUrl &&
    dbUrl.includes('-pooler') &&
    directUrl.includes('-pooler')
  ) {
    logger.warn(
      'DIRECT_URL uses a Neon pooler host (-pooler). Point DIRECT_URL at the Neon *direct* endpoint (no -pooler) so prisma migrate deploy works reliably.',
    );
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
      const parsed = new URL(redisUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        const hasToken = Boolean(
          process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
          process.env.REDIS_PASSWORD?.trim() ||
          parsed.password,
        );
        if (!hasToken) {
          invalid.push(
            'REDIS_URL uses http(s) (Upstash REST) but no token is set — use rediss://default:<token>@<host>:6379 or set UPSTASH_REDIS_REST_TOKEN',
          );
        } else if (isStrict) {
          logger.warn(
            'REDIS_URL is an Upstash REST https:// URL; it will be auto-converted to rediss:// on port 6379 at runtime. Prefer setting rediss://default:<token>@<host>:6379 directly in Render.',
          );
        }
      } else if (
        parsed.hostname.includes('upstash.io') &&
        (parsed.port === '443' || parsed.port === '80')
      ) {
        if (isStrict) {
          logger.warn(
            `REDIS_URL uses Upstash port ${parsed.port}; it will be corrected to 6379 at runtime. Set rediss://…:6379 in Render to silence this.`,
          );
        }
      }
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
  process.on('unhandledRejection', (reason) => {
    logger.error(
      `Unhandled promise rejection (process kept alive): ${
        reason instanceof Error
          ? (reason.stack ?? reason.message)
          : String(reason)
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

  const redisIoAdapter = new RedisIoAdapter(app);
  if (await redisIoAdapter.connectToRedis()) {
    app.useWebSocketAdapter(redisIoAdapter);
  }

  app.enableShutdownHooks();

  const requestedPort = Number(
    process.env.PORT || process.env.API_PORT || 4000,
  );
  const logger = new Logger('Bootstrap');

  if (
    Number.isNaN(requestedPort) ||
    requestedPort < 1 ||
    requestedPort > 65535
  ) {
    logger.error(
      `Invalid port value: "${process.env.PORT ?? process.env.API_PORT}". Exiting.`,
    );
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

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', version: '1.0.4' });
  });

  await app.listen(port, host);
  logger.log(`API is running on: ${apiPublicUrl}`);

  if (process.env.NODE_ENV !== 'production') {
    logger.log(`Documentation: ${apiPublicUrl}/api/docs`);
  }
}
bootstrap();
