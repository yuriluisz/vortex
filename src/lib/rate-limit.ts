import "server-only";
import { redis } from "@/lib/redis";

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Rate limiter baseado em Redis (sorted set — sliding window).
 *
 * Usado para:
 * - Login: 5 tentativas por minuto por IP
 * - OTP: 3 tentativas por 5 minutos por email
 * - Criação de tenant: 1 por hora por IP
 * - Criação de campanha: 10 por hora por tenant
 *
 * @param key  Chave única para o rate limit (ex: "login:ip:127.0.0.1")
 * @param config  Configuração da janela e limite
 */
export async function rateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  const redisKey = `ratelimit:${key}`;

  // Pipeline: limpar entradas antigas, adicionar a atual, contar, expirar
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zadd(redisKey, now, `${now}-${crypto.randomUUID()}`);
  pipeline.zcard(redisKey);
  pipeline.expire(redisKey, config.windowSeconds);

  const results = await pipeline.exec();

  if (!results) {
    // Se Redis falhar, permitir por segurança (fail open)
    return { allowed: true, remaining: 1, resetIn: config.windowSeconds };
  }

  const requestCount = (results[2]?.[1] as number) ?? 0;

  const allowed = requestCount <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - requestCount);
  const resetIn = config.windowSeconds;

  return { allowed, remaining, resetIn };
}

/**
 * Rate limit presets para uso no sistema.
 */
export const RATE_LIMITS = {
  /** Login: 5 tentativas por minuto por IP */
  LOGIN: { windowSeconds: 60, maxRequests: 5 } as RateLimitConfig,
  /** OTP: 3 tentativas por 5 minutos por email */
  OTP: { windowSeconds: 300, maxRequests: 3 } as RateLimitConfig,
  /** Criação de tenant: 1 por hora por IP */
  TENANT_CREATION: { windowSeconds: 3600, maxRequests: 1 } as RateLimitConfig,
  /** Criação de campanha: 10 por hora por tenant */
  CAMPAIGN_CREATION: { windowSeconds: 3600, maxRequests: 10 } as RateLimitConfig,
  /** Criação de grupo: 20 por hora por tenant */
  GROUP_CREATION: { windowSeconds: 3600, maxRequests: 20 } as RateLimitConfig,
};