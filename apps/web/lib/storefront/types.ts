import type { Product, ProductVariant } from "@/lib/seller/types";

/**
 * The storefront's narrower view of a product — no `status` (public products
 * are always active) and no `sku` on variants, since that's the seller's own
 * inventory reference. Mirrors PublicProductTransformer on the API.
 *
 * The shared building blocks still live under `lib/seller` because that's
 * where products were first modelled; worth hoisting to a neutral module if
 * the storefront grows more of its own shapes.
 */
export type PublicProductVariant = Omit<ProductVariant, "sku" | "createdAt">;

export type PublicProduct = Omit<Product, "status" | "variants"> & {
  shop: { name: string; slug: string };
  variants: PublicProductVariant[];
};

/**
 * Grid-card shape. The API collapses variants into a price range server-side
 * so a listing doesn't ship every product's whole option tree. All three
 * nullable fields are null only for a product with no images or no variants.
 */
export type PublicProductCard = {
  id: string;
  title: string;
  slug: string;
  shop: { name: string; slug: string };
  imageUrl: string | null;
  priceMin: string | null;
  priceMax: string | null;
};
