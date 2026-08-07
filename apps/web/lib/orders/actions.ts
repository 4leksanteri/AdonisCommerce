"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { CartItem } from "@/lib/cart/types";
import type { Payment } from "@/lib/payments/types";
import type { Order, ShippingInput } from "./types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type PlaceOrderResult =
  | { orders: Order[]; payments: Payment[]; errors?: undefined }
  | { orders?: undefined; payments?: undefined; errors: ApiErrorItem[] };

/**
 * Sends only variant ids and quantities — prices, shipping and availability
 * are all re-derived server-side inside a transaction, so nothing the browser
 * says can change what an order costs.
 *
 * The orders come back unpaid, each holding its stock for a short window, and
 * the returned payments carry the client secrets the browser needs to charge
 * the card. Nothing becomes `paid` until Stripe says so over the webhook.
 */
export async function placeOrderAction(
  items: CartItem[],
  shipping: ShippingInput
): Promise<PlaceOrderResult> {
  try {
    const res = await apiFetch<{ data: { orders: Order[]; payments: Payment[] } }>(
      "/api/storefront/orders",
      { method: "POST", body: JSON.stringify({ items, shipping }) }
    );
    return { orders: res.data.orders, payments: res.data.payments };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}
