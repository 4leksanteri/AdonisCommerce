import { getTranslations } from "next-intl/server";
import { ProductCard } from "@/components/storefront/product-card";
import { getDisplayCurrency, getExchangeRates } from "@/lib/storefront/currency";
import type { PublicProductCard } from "@/lib/storefront/types";

/**
 * The listing grid, wherever listings are shown. Reads the shopper's chosen
 * currency itself rather than making every caller thread it through — it is
 * the same answer on every page, and the request-level cache means asking
 * repeatedly costs nothing.
 */
export async function ProductGrid({
  products,
  emptyMessage,
  showShop = true,
}: {
  products: PublicProductCard[];
  /** What to say instead of the grid. Defaults to a generic "nothing here". */
  emptyMessage?: string;
  showShop?: boolean;
}) {
  const [displayCurrency, rates, t] = await Promise.all([
    getDisplayCurrency(),
    getExchangeRates(),
    getTranslations("Storefront.browse"),
  ]);

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-sm text-muted">
        {emptyMessage ?? t("empty")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          displayCurrency={displayCurrency}
          rates={rates}
          showShop={showShop}
        />
      ))}
    </div>
  );
}
