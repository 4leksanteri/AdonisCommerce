import "server-only";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicProduct } from "./types";

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
      `/api/shops/${encodeURIComponent(shopSlug)}/products/${encodeURIComponent(productSlug)}`,
      {},
      null
    );
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
