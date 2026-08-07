import "server-only";
import { apiFetch, ApiError } from "@/lib/api";
import type { Order } from "./types";

/** Scoped to the signed-in buyer by the API; someone else's order is a 404. */
export async function getOrder(reference: string): Promise<Order | null> {
  try {
    const res = await apiFetch<{ data: Order }>(
      `/api/storefront/orders/${encodeURIComponent(reference)}`
    );
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401)) return null;
    throw error;
  }
}
