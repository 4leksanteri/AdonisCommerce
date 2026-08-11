import "server-only";
import { apiFetch, ApiError } from "@/lib/api";
import type { Conversation } from "./types";

/**
 * Null when the caller has no business in this thread — the API 404s a
 * stranger rather than telling them the order exists, so the page simply
 * renders nothing.
 */
export async function getConversation(orderId: string): Promise<Conversation | null> {
  try {
    const res = await apiFetch<{ data: Conversation }>(`/api/order-messages/${orderId}`);
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401)) return null;
    throw error;
  }
}
