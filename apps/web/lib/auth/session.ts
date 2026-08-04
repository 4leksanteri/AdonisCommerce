import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { redis } from "@/lib/redis";

const COOKIE_NAME = "session_id";
const SESSION_PREFIX = "websession:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * The browser only ever sees this opaque, random session id — never the
 * real Adonis access token. The token itself lives server-side in Redis,
 * keyed by the session id, so a leaked cookie is useless on its own.
 */
export async function createSession(token: string) {
  const sessionId = randomBytes(32).toString("hex");
  await redis.set(`${SESSION_PREFIX}${sessionId}`, token, "EX", SESSION_TTL_SECONDS);

  const store = await cookies();
  store.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;

  return redis.get(`${SESSION_PREFIX}${sessionId}`);
}

export async function clearSession() {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  if (sessionId) {
    await redis.del(`${SESSION_PREFIX}${sessionId}`);
  }
  store.delete(COOKIE_NAME);
}
