import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { PublicProductCard } from "@/lib/storefront/types";

function formatPriceRange(min: string | null, max: string | null) {
  if (min === null || max === null) return null;
  return min === max ? `€${min}` : `€${min}–€${max}`;
}

export function ProductCard({ product }: { product: PublicProductCard }) {
  const price = formatPriceRange(product.priceMin, product.priceMax);

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
