import "server-only";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  ProductSearchResults,
  PublicProduct,
  PublicProductCard,
  ShopPage,
  StorefrontCategory,
} from "./types";

/**
 * Browse, search and the homepage grid are all the same call — the last one
 * is just this with nothing set. Anonymous like every storefront call, see
 * `getPublicProduct`.
 */
export async function searchProducts(params: {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
}): Promise<ProductSearchResults> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.sort) query.set("sort", params.sort);
  if (params.page && params.page > 1) query.set("page", String(params.page));

  const res = await apiFetch<{ data: ProductSearchResults }>(
    `/api/storefront/products?${query}`,
    {},
    null
  );
  return res.data;
}

/** The homepage grid: the newest listings, no filters, no pager. */
export async function getStorefrontProducts(): Promise<PublicProductCard[]> {
  const { products } = await searchProducts({});
  return products;
}

/** The taxonomy in one language, for the browse nav. */
export async function getStorefrontCategories(locale: string): Promise<StorefrontCategory[]> {
  const res = await apiFetch<{ data: StorefrontCategory[] }>(
    `/api/categories?locale=${encodeURIComponent(locale)}`,
    {},
    null
  );
  return res.data;
}

/**
 * One category, by a slug in either language. `slug` on the answer is the
 * canonical one for `locale`, which is how the page knows whether the URL it
 * was asked for is the one it should be serving.
 */
export async function getCategoryBySlug(
  slug: string,
  locale: string
): Promise<StorefrontCategory | null> {
  try {
    const res = await apiFetch<{ data: StorefrontCategory }>(
      `/api/categories/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
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
  productSlug: string,
  /** The category name is data, not UI copy, so the API translates it. */
  locale: string
): Promise<PublicProduct | null> {
  try {
    const res = await apiFetch<{ data: PublicProduct }>(
      `/api/storefront/shops/${encodeURIComponent(shopSlug)}/products/${encodeURIComponent(productSlug)}?locale=${encodeURIComponent(locale)}`,
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
