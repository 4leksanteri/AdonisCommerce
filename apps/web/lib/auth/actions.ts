"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import { createSession, clearSession } from "./session";
import type { User } from "./types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

/**
 * Pre-auth endpoints are called with the token explicitly overridden to
 * `null` so `apiFetch` doesn't attach whatever session already exists.
 * These calls establish a new identity — carrying the old one in is at
 * best meaningless and at worst poisons the request, e.g. an expired or
 * malformed token making login fail for someone trying to fix exactly
 * that by logging in again.
 */
const ANONYMOUS = null;

type AuthActionResult = { user: User; errors?: undefined } | { user?: undefined; errors: ApiErrorItem[] };

export async function loginAction(email: string, password: string): Promise<AuthActionResult> {
  try {
    const res = await apiFetch<{ data: { token: string; user: User } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      ANONYMOUS
    );
    await createSession(res.data.token);
    return { user: res.data.user };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export async function registerAction(
  fullName: string,
  email: string,
  password: string,
  passwordConfirmation: string,
  /**
   * Remembered on the account. Order emails go out from webhooks and
   * background jobs, which have no request to read a language from, so the
   * one they signed up in is the only signal we get.
   */
  locale: string
): Promise<AuthActionResult> {
  try {
    const res = await apiFetch<{ data: { token: string; user: User } }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ fullName, email, password, passwordConfirmation, locale }),
      },
      ANONYMOUS
    );
    await createSession(res.data.token);
    return { user: res.data.user };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export async function logoutAction(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  await clearSession();
}

type MessageActionResult = { code: string; errors?: undefined } | { code?: undefined; errors: ApiErrorItem[] };

export async function forgotPasswordAction(email: string, locale: string): Promise<MessageActionResult> {
  try {
    const res = await apiFetch<{ code: string }>(
      "/api/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email, locale }) },
      ANONYMOUS
    );
    return { code: res.code };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export async function resetPasswordAction(
  email: string,
  token: string,
  password: string,
  passwordConfirmation: string
): Promise<MessageActionResult> {
  try {
    const res = await apiFetch<{ code: string }>(
      "/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ email, token, password, passwordConfirmation }),
      },
      ANONYMOUS
    );
    return { code: res.code };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}
