import Redis, { Redis as IORedis, RedisOptions } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConnection');

export const UPSTASH_REDIS_TLS_PORT = 6379;

export const isInMemoryRedis = (): boolean => {
  if (process.env.REDIS_INMEMORY === 'true') return true;
  return (
    process.env.NODE_ENV === 'test' &&
    process.env.API_TEST_WITH_INFRA !== 'true'
  );
};

export function resolveUpstashRedisUrl(
  restOrRedisUrl: string,
  token: string,
): string {
  const parsed = new URL(restOrRedisUrl);
  return `rediss://default:${encodeURIComponent(token)}@${parsed.hostname}:${UPSTASH_REDIS_TLS_PORT}`;
}

function isUpstashHost(hostname: string): boolean {
  return hostname.includes('upstash.io');
}

function normalizeRedisUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
      process.env.REDIS_PASSWORD?.trim() ||
      decodeURIComponent(parsed.password || '');

    if (!token) {
      logger.error(
        'REDIS_URL uses http(s) (Upstash REST) but no UPSTASH_REDIS_REST_TOKEN or REDIS_PASSWORD is set — cannot derive a Redis wire URL. Use rediss://default:<token>@<host>:6379',
      );
      return url;
    }

    logger.warn(
      `REDIS_URL is an HTTP REST endpoint (${parsed.hostname}); converting to Redis TLS on port ${UPSTASH_REDIS_TLS_PORT}`,
    );
    return resolveUpstashRedisUrl(url, token);
  }

  if (
    isUpstashHost(parsed.hostname) &&
    (parsed.port === '443' || parsed.port === '80')
  ) {
    logger.warn(
      `REDIS_URL points Upstash at port ${parsed.port}; correcting to ${UPSTASH_REDIS_TLS_PORT} (Redis TLS wire protocol)`,
    );
    parsed.port = String(UPSTASH_REDIS_TLS_PORT);
    return parsed.toString();
  }

  if (
    parsed.protocol === 'rediss:' &&
    isUpstashHost(parsed.hostname) &&
    !parsed.port
  ) {
    parsed.port = String(UPSTASH_REDIS_TLS_PORT);
    return parsed.toString();
  }

  return url;
}

export function buildRedisUrlFromEnv(): string {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    return normalizeRedisUrl(redisUrl);
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (upstashUrl && upstashToken) {
    return resolveUpstashRedisUrl(upstashUrl, upstashToken);
  }

  const redisHost = process.env.REDIS_HOST?.trim() || 'redis';
  const redisPort = Number(process.env.REDIS_PORT) || 6379;
  const redisPassword = process.env.REDIS_PASSWORD?.trim();
  if (redisPassword) {
    return `redis://default:${encodeURIComponent(redisPassword)}@${redisHost}:${redisPort}`;
  }

  return `redis://${redisHost}:${redisPort}`;
}

export function getRedisClientOptions(): RedisOptions {
  const url = buildRedisUrlFromEnv();
  const options: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
  };
  if (url.startsWith('rediss://')) {
    options.tls = {};
  }
  return options;
}

export const createRedisClient = (): IORedis =>
  isInMemoryRedis()
    ? (new RedisMock() as unknown as IORedis)
    : new Redis(buildRedisUrlFromEnv(), getRedisClientOptions());

export const getRedisConnectionUrl = (): string => buildRedisUrlFromEnv();

export const redisClient: IORedis = createRedisClient();

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  logger.log('Successfully connected to Redis');
});

export type { IORedis };
