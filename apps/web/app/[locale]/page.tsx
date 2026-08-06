import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/storefront/product-card";
import { getStorefrontProducts } from "@/lib/storefront/queries";
import { getDisplayCurrency, getExchangeRates } from "@/lib/storefront/currency";

export default async function Home() {
  const [products, t, displayCurrency, rates] = await Promise.all([
    getStorefrontProducts(),
    getTranslations("Storefront.home"),
    getDisplayCurrency(),
    getExchangeRates(),
  ]);

  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted">
            {t("empty")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                displayCurrency={displayCurrency}
                rates={rates}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
