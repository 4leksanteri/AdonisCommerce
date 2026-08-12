import "server-only";
import { redirect } from "@/i18n/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/queries";
import type { Seller, User } from "@/lib/auth/types";
import type { SellerOrder } from "@/lib/orders/types";
import type { PayoutDetails } from "@/lib/payments/types";
import type { Category, Product, OrderStats } from "./types";
import type { ShippingProfile } from "./shipping-types";

/**
 * Redirects non-sellers home. Called from seller pages (not the shared
 * layout) since layouts don't re-run on client-side navigation between
 * sibling pages — see Next's auth guide on checks close to the data.
 */
export async function requireSeller(locale: string): Promise<User & { seller: Seller }> {
  const user = await getCurrentUser();

  if (!user || !user.seller) {
    redirect({ href: "/", locale });
  }

  return user as User & { seller: Seller };
}

export async function getSellerProducts(): Promise<Product[]> {
  const res = await apiFetch<{ data: Product[] }>("/api/products");
  return res.data;
}

/**
 * Returns null rather than throwing when the id doesn't resolve, so the page
 * can hand off to `notFound()`. The API scopes the lookup to the calling
 * seller, so another seller's product is a 404 here too.
 */
export async function getSellerProduct(id: string): Promise<Product | null> {
  try {
    const res = await apiFetch<{ data: Product }>(`/api/products/${id}`);
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getShippingProfiles(): Promise<ShippingProfile[]> {
  const res = await apiFetch<{ data: ShippingProfile[] }>("/api/shipping-profiles");
  return res.data;
}

/**
 * Scoped to the calling seller's shop by the API. Defaults to orders that are
 * actually sales — unpaid checkouts are left out unless `status` asks for them.
 */
export async function getSellerOrders(status?: string): Promise<SellerOrder[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiFetch<{ data: SellerOrder[] }>(`/api/orders${query}`);
  return res.data;
}

/** Another shop's order id is a 404 here, same as a missing one. */
export async function getSellerOrder(id: string): Promise<SellerOrder | null> {
  try {
    const res = await apiFetch<{ data: SellerOrder }>(`/api/orders/${id}`);
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Read live from Stripe on every request rather than from our own
 * `payout_status` column. Stripe can restrict an account at any moment, and a
 * page telling a seller they're getting paid when they aren't is worse than
 * one that's a beat slow to load.
 */
export async function getPayoutDetails(): Promise<PayoutDetails> {
  const res = await apiFetch<{ data: PayoutDetails }>("/api/sellers/me/payouts");
  return res.data;
}

/**
 * The curated taxonomy in the seller's language. Public data, but fetched
 * here because the product form is the only thing that needs it today.
 */
export async function getCategories(locale: string): Promise<Category[]> {
  const res = await apiFetch<{ data: Category[] }>(
    `/api/categories?locale=${encodeURIComponent(locale)}`,
    {},
    null
  );
  return res.data;
}

/** Summary figures for the orders screen. */
export async function getOrderStats(): Promise<OrderStats | null> {
  try {
    const res = await apiFetch<{ data: OrderStats }>("/api/orders/stats");
    return res.data;
  } catch (error) {
    // The cards are a summary, not the page — a shop with no stats yet
    // should still get its orders.
    if (error instanceof ApiError) return null;
    throw error;
  }
}
