import "server-only";
import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
