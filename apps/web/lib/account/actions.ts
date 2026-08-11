"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { User } from "@/lib/auth/types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type UserActionResult =
  { user: User; errors?: undefined } | { user?: undefined; errors: ApiErrorItem[] };

type MessageActionResult =
  { code: string; errors?: undefined } | { code?: undefined; errors: ApiErrorItem[] };

async function patch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function updateProfileAction(
  fullName: string | null,
  locale: string
): Promise<UserActionResult> {
  try {
    const res = await patch<{ data: User }>("/api/account/profile", { fullName, locale });
    return { user: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export async function updateEmailAction(
  email: string,
  currentPassword: string
): Promise<UserActionResult> {
  try {
    const res = await patch<{ data: User }>("/api/account/email", { email, currentPassword });
    return { user: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

/**
 * Succeeding here signs out every other session, so the answer carries no
 * user — nothing about this account's own view of itself has changed.
 */
export async function updatePasswordAction(
  currentPassword: string,
  password: string,
  passwordConfirmation: string
): Promise<MessageActionResult> {
  try {
    const res = await patch<{ code: string }>("/api/account/password", {
      currentPassword,
      password,
      passwordConfirmation,
    });
    return { code: res.code };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}
