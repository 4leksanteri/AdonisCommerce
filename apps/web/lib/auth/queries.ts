import "server-only";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionToken, clearSession } from "./session";
import type { User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
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
}
