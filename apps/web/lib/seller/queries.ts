import "server-only";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/queries";
import type { Seller, User } from "@/lib/auth/types";

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
