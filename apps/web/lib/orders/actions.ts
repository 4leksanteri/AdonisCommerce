"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { CartItem } from "@/lib/cart/types";
import type { Order, ShippingInput } from "./types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type PlaceOrderResult =
  | { orders: Order[]; errors?: undefined }
  | { orders?: undefined; errors: ApiErrorItem[] };

/**
 * Sends only variant ids and quantities — prices, shipping and availability
 * are all re-derived server-side inside a transaction, so nothing the browser
 * says can change what an order costs.
 */
export async function placeOrderAction(
  items: CartItem[],
  shipping: ShippingInput
): Promise<PlaceOrderResult> {
  try {
    const res = await apiFetch<{ data: Order[] }>("/api/storefront/orders", {
      method: "POST",
      body: JSON.stringify({ items, shipping }),
    });
    return { orders: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}
