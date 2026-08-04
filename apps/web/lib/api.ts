import "server-only";
import { getSessionToken } from "./auth/session";

const API_URL = process.env.API_INTERNAL_URL;

/**
 * `code` comes from our own custom-thrown API errors (e.g. PASSWORD_RESET_TOKEN_INVALID).
 * `rule`/`field` come from VineJS validation failures (e.g. rule "email", field "email").
 * Never both — the frontend maps whichever is present to a translation key.
 */
export type ApiErrorItem = {
  message: string;
  code?: string;
  rule?: string;
  field?: string;
};

export class ApiError extends Error {
  items: ApiErrorItem[];
  status: number;

  constructor(items: ApiErrorItem[], status: number) {
    super(items.map((item) => item.message).join(", "));
    this.items = items;
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
    const items: ApiErrorItem[] = body?.errors ?? [
      { code: "GENERIC_ERROR", message: "Something went wrong. Please try again." },
    ];
    throw new ApiError(items, response.status);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}
