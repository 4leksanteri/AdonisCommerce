import "server-only";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicProduct, PublicProductCard, ShopPage } from "./types";

/**
 * Newest active products across all shops, for the homepage grid.
 * Anonymous like every storefront call — see `getPublicProduct`.
 */
export async function getStorefrontProducts(limit?: number): Promise<PublicProductCard[]> {
  const query = limit === undefined ? "" : `?limit=${limit}`;
  const res = await apiFetch<{ data: PublicProductCard[] }>(
    `/api/storefront/products${query}`,
    {},
    null
  );
  return res.data;
}

/**
 * Storefront product lookup. Passes `null` as the token override so the
 * request stays anonymous even when a seller happens to be logged in —
 * what a shopper sees must not depend on who is browsing.
 *
 * Returns null on 404 so the page can hand off to `notFound()`. The API
 * 404s (rather than 403s) for drafts, archived products and unapproved
 * shops, so all of those land here as "no such page".
 */
export async function getPublicProduct(
  shopSlug: string,
  productSlug: string
): Promise<PublicProduct | null> {
  try {
    const res = await apiFetch<{ data: PublicProduct }>(
      `/api/storefront/shops/${encodeURIComponent(shopSlug)}/products/${encodeURIComponent(productSlug)}`,
      {},
      null
    );
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * A shop's front door and its listings. Anonymous like the rest of the
 * storefront, and null on 404 so the page can hand off to `notFound()` — the
 * API 404s an unapproved shop rather than 403ing it.
 */
export async function getShop(shopSlug: string): Promise<ShopPage | null> {
  try {
    const res = await apiFetch<{ data: ShopPage }>(
      `/api/storefront/shops/${encodeURIComponent(shopSlug)}`,
      {},
      null
    );
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
