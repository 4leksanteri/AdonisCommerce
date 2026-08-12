import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ContactShop } from "@/components/messages/contact-shop";
import { ProductCard } from "@/components/storefront/product-card";
import { CountryName } from "@/components/storefront/country-name";
import { ShopAvatar } from "@/components/storefront/shop-avatar";
import { Stars } from "@/components/storefront/stars";
import { ResultsPager } from "@/components/storefront/results-pager";
import { Link } from "@/i18n/navigation";
import { getDisplayCurrency, getExchangeRates } from "@/lib/storefront/currency";
import { getShop } from "@/lib/storefront/queries";

export default async function ShopPage(props: PageProps<"/[locale]/shop/[shopSlug]">) {
  const [{ shopSlug }, searchParams] = await Promise.all([props.params, props.searchParams]);

  const requested = Number(
    Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page
  );
  const page = Number.isInteger(requested) && requested > 1 ? requested : 1;

  const [data, t, tReviews, displayCurrency, rates, format] = await Promise.all([
    getShop(shopSlug, page),
    getTranslations("Storefront.shop"),
    getTranslations("Reviews"),
    getDisplayCurrency(),
    getExchangeRates(),
    getFormatter(),
  ]);

  // Covers a shop that was never approved as well as one that doesn't exist —
  // the API 404s both, and a shopper has no business telling them apart.
  if (!data) notFound();

  const { shop, products, total, lastPage, rating, reviews } = data;
  const ratingText = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-8">
        <header className="flex flex-col gap-3 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <ShopAvatar name={shop.name} url={shop.avatarUrl} size="lg" />
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-foreground">{shop.name}</h1>
              {/* A shop's rating is its items' reviews combined — there is no
                  separate thing to write, same as Etsy. */}
              {rating.average !== null && (
                <span className="flex items-center gap-2">
                  <Stars
                    value={rating.average}
                    label={tReviews("ratingLabel", {
                      rating: ratingText(rating.average),
                      count: rating.count,
                    })}
                  />
                  <span className="text-sm text-muted">
                    {tReviews("countSummary", {
                      rating: ratingText(rating.average),
                      count: rating.count,
                    })}
                  </span>
                </span>
              )}
            </div>

            {/* Beside the shop's identity, because "ask before you buy" is
                what this page is for as much as browsing is. */}
            <div className="ml-auto">
              <ContactShop shopSlug={shop.slug} shopName={shop.name} />
            </div>
          </div>

          {shop.description && (
            <p className="max-w-reading text-sm whitespace-pre-line text-muted">{shop.description}</p>
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
          <div className="rounded-card border border-border p-8 text-center text-sm text-muted">
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

        {/* A shop with more than a page of work was showing only its first
            24 items, with nothing to say there were more. */}
        <ResultsPager
          page={page}
          lastPage={lastPage}
          hrefFor={(target) => ({
            pathname: "/shop/[shopSlug]",
            params: { shopSlug },
            query: target > 1 ? { page: String(target) } : {},
          })}
        />

        {reviews.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <h2 className="font-medium text-foreground">
              {tReviews("heading", { count: rating.count })}
            </h2>

            {reviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars
                    value={review.rating}
                    label={tReviews("stars", { count: review.rating })}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {review.author ?? tReviews("anonymous")}
                  </span>
                  <span className="text-xs text-muted">
                    {format.dateTime(new Date(review.createdAt), { dateStyle: "medium" })}
                  </span>
                </div>

                {/* Which item it was about — the shop page lists reviews across
                    everything, so without this they float free. */}
                {review.productSlug ? (
                  <Link
                    href={{
                      pathname: "/shop/[shopSlug]/[productSlug]",
                      params: { shopSlug: shop.slug, productSlug: review.productSlug },
                    }}
                    className="w-fit text-xs text-muted no-underline hover:text-foreground"
                  >
                    {review.productTitle}
                  </Link>
                ) : (
                  <span className="text-xs text-muted">{review.productTitle}</span>
                )}

                {review.body && (
                  <p className="text-sm whitespace-pre-line text-muted">{review.body}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
