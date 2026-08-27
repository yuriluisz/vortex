import Redis, { type RedisOptions } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const defaultRedisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
};

export function getRedisUrl(): string {
  return process.env.REDIS_URL || "redis://localhost:6379";
}

export function createRedisConnection(customOptions?: Partial<RedisOptions>): Redis {
  return new Redis(getRedisUrl(), {
    ...defaultRedisOptions,
    ...customOptions,
  });
}

export const redis =
  globalForRedis.redis ??
  createRedisConnection();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

