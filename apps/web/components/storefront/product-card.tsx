import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Stars } from "@/components/storefront/stars";
import { convertCents, currencyFormat, toMajorUnits, type ExchangeRates } from "@/lib/format";
import type { PublicProductCard } from "@/lib/storefront/types";

type Props = {
  product: PublicProductCard;
  /** Null means the shopper hasn't picked one — show the seller's currency. */
  displayCurrency: string | null;
  rates: ExchangeRates;
  /** False on a shop's own page, where every card is from the same shop. */
  showShop?: boolean;
};

export async function ProductCard({ product, displayCurrency, rates, showShop = true }: Props) {
  const [format, t] = await Promise.all([getFormatter(), getTranslations("Reviews")]);
  const { priceMinCents, priceMaxCents, currency } = product;

  // Falls back to the seller's own currency whenever conversion isn't
  // possible, so a missing rate shows a correct price rather than none.
  const target =
    displayCurrency && convertCents(100, currency, displayCurrency, rates) !== null
      ? displayCurrency
      : currency;
  const isConverted = target !== currency;

  const money = (cents: number) => {
    const amount = convertCents(cents, currency, target, rates) ?? cents;
    return format.number(toMajorUnits(amount), currencyFormat(target));
  };

  const price =
    priceMinCents === null || priceMaxCents === null
      ? null
      : priceMinCents === priceMaxCents
        ? money(priceMinCents)
        : `${money(priceMinCents)}–${money(priceMaxCents)}`;

  return (
    <Link
      href={{
        pathname: "/shop/[shopSlug]/[productSlug]",
        params: { shopSlug: product.shop.slug, productSlug: product.slug },
      }}
      className="group flex flex-col gap-2 no-underline"
    >
      <div className="aspect-square overflow-hidden rounded-xl border border-border bg-selected">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt=""
            width={400}
            height={400}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="truncate font-medium text-foreground">{product.title}</p>
        {showShop && <p className="truncate text-sm text-muted">{product.shop.name}</p>}
        {/* Only once someone has actually rated it — an empty row of grey
            stars reads as a bad score rather than as no score. */}
        {product.rating.average !== null && (
          <span className="flex items-center gap-1.5">
            <Stars
              value={product.rating.average}
              label={t("ratingLabel", {
                rating: format.number(product.rating.average, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }),
                count: product.rating.count,
              })}
            />
            <span className="text-xs text-muted">({product.rating.count})</span>
          </span>
        )}
        {price && (
          <p className="text-sm text-foreground">
            {/* The "≈" is load-bearing: this is a converted estimate, and the
                seller still prices and charges in their own currency. */}
            {isConverted ? `≈ ${price}` : price}
          </p>
        )}
      </div>
    </Link>
  );
}
