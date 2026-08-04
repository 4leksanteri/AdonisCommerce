import "server-only";
import { getSessionToken } from "./auth/session";

const API_URL = process.env.API_INTERNAL_URL;

export class ApiError extends Error {
  messages: string[];
  status: number;

  constructor(messages: string[], status: number) {
    super(messages.join(", "));
    this.messages = messages;
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  tokenOverride?: string | null
): Promise<T> {
  const token = tokenOverride !== undefined ? tokenOverride : await getSessionToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const messages: string[] =
      body?.errors?.map((error: { message: string }) => error.message) ?? [
        "Something went wrong. Please try again.",
      ];
    throw new ApiError(messages, response.status);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}
