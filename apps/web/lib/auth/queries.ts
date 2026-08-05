import "server-only";
import { cache } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionToken, clearSession } from "./session";
import type { User } from "./types";

/**
 * Wrapped in React's cache() so calling this from both the root layout
 * and a page in the same request only hits the API once, not twice.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!(await getSessionToken())) return null;

  try {
    const res = await apiFetch<{ data: User }>("/api/auth/me");
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearSession();
    }
    return null;
  }
});
