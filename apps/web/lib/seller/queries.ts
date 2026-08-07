import "server-only";
import { redirect } from "@/i18n/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/queries";
import type { Seller, User } from "@/lib/auth/types";
import type { Product } from "./types";
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
