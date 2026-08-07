"use server";

import { apiFetch, ApiError } from "@/lib/api";
import type { CartItem, CartLine } from "./types";

/**
 * Exchanges stored `{ variantId, quantity }` pairs for current line data.
 * Anonymous — a cart is public until checkout, and what it contains must not
 * depend on who is signed in.
 *
 * Returns an empty list on failure so a flaky API shows an empty cart rather
 * than crashing the header on every page.
 */
export async function hydrateCartAction(items: CartItem[]): Promise<CartLine[]> {
  if (items.length === 0) return [];

  try {
    const res = await apiFetch<{ data: CartLine[] }>(
      "/api/storefront/cart",
      { method: "POST", body: JSON.stringify({ items }) },
      null
    );
    return res.data;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return [];
  }
}
