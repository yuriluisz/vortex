import Redis, { type RedisOptions } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const defaultRedisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
};

export function getRedisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("❌ [FATAL] REDIS_URL não está configurada no ambiente de produção.");
    }
    return "redis://localhost:6379";
  }
  return url;
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

