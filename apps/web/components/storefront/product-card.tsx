import Image from "next/image";
import { getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import type { PublicProductCard } from "@/lib/storefront/types";

export async function ProductCard({ product }: { product: PublicProductCard }) {
  const format = await getFormatter();

  const { priceMinCents, priceMaxCents, currency } = product;
  const money = (cents: number) => format.number(toMajorUnits(cents), currencyFormat(currency));
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
      <div className="aspect-square overflow-hidden rounded-xl border border-border bg-surface">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt=""
            width={400}
            height={400}
            unoptimized
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="truncate font-medium text-foreground">{product.title}</p>
        <p className="truncate text-sm text-muted">{product.shop.name}</p>
        {price && <p className="text-sm text-foreground">{price}</p>}
      </div>
    </Link>
  );
}
