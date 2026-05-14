import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

// Key helpers
export const keys = {
  rankingEra: (eraId: string) => `ranking:era:${eraId}`,
  rankingMonthly: (month: string) => `ranking:monthly:${month}`,
  rankingAllTime: () => `ranking:all_time`,
  rateLimitLastfm: (userId: string) => `ratelimit:lastfm:${userId}`,
  userPoints: (userId: string) => `user:points:${userId}`,
} as const;

export const RANKING_CACHE_TTL = 300; // 5 minutos
