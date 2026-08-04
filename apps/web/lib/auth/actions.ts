"use server";

import { apiFetch, ApiError } from "@/lib/api";
import { createSession, clearSession } from "./session";
import type { User } from "./types";

type AuthActionResult = { user: User; errors?: undefined } | { user?: undefined; errors: string[] };

export async function loginAction(email: string, password: string): Promise<AuthActionResult> {
  try {
    const res = await apiFetch<{ data: { token: string; user: User } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await createSession(res.data.token);
    return { user: res.data.user };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.messages : ["Something went wrong."] };
  }
}

export async function registerAction(
  fullName: string,
  email: string,
  password: string,
  passwordConfirmation: string
): Promise<AuthActionResult> {
  try {
    const res = await apiFetch<{ data: { token: string; user: User } }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password, passwordConfirmation }),
    });
    await createSession(res.data.token);
    return { user: res.data.user };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.messages : ["Something went wrong."] };
  }
}

export async function logoutAction(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  await clearSession();
}

type MessageActionResult = { message: string; errors?: undefined } | { message?: undefined; errors: string[] };

export async function forgotPasswordAction(email: string): Promise<MessageActionResult> {
  try {
    const res = await apiFetch<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { message: res.message };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.messages : ["Something went wrong."] };
  }
}

export async function resetPasswordAction(
  email: string,
  token: string,
  password: string,
  passwordConfirmation: string
): Promise<MessageActionResult> {
  try {
    const res = await apiFetch<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, token, password, passwordConfirmation }),
    });
    return { message: res.message };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.messages : ["Something went wrong."] };
  }
}
