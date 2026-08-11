import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/storefront/product-card";
import { CountryName } from "@/components/storefront/country-name";
import { ShopAvatar } from "@/components/storefront/shop-avatar";
import { getDisplayCurrency, getExchangeRates } from "@/lib/storefront/currency";
import { getShop } from "@/lib/storefront/queries";

export default async function ShopPage(props: PageProps<"/[locale]/shop/[shopSlug]">) {
  const { shopSlug } = await props.params;

  const [data, t, displayCurrency, rates, format] = await Promise.all([
    getShop(shopSlug),
    getTranslations("Storefront.shop"),
    getDisplayCurrency(),
    getExchangeRates(),
    getFormatter(),
  ]);

  // Covers a shop that was never approved as well as one that doesn't exist —
  // the API 404s both, and a shopper has no business telling them apart.
  if (!data) notFound();

  const { shop, products, total } = data;

  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <ShopAvatar name={shop.name} url={shop.avatarUrl} size="lg" />
            <h1 className="text-2xl font-semibold text-foreground">{shop.name}</h1>
          </div>

          {shop.description && (
            <p className="max-w-2xl text-sm whitespace-pre-line text-muted">{shop.description}</p>
          )}

          {/* Each fact gets its own label rather than being written into a
              sentence. Finnish inflects place names — "Suomesta", not
              "Suomi" — and no formatting API produces those endings. */}
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted">{t("shipsFrom")}</dt>
              <dd className="text-foreground">
                <CountryName code={shop.country} />
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">{t("openedLabel")}</dt>
              <dd className="text-foreground">
                {format.dateTime(new Date(shop.memberSince), { year: "numeric", month: "long" })}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">{t("itemsLabel")}</dt>
              <dd className="text-foreground">{total}</dd>
            </div>
          </dl>
        </header>

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
                showShop={false}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
