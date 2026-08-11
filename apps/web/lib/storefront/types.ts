import type { Product, ProductVariant } from "@/lib/seller/types";
import type { PublicShippingRate } from "./shipping";

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

export type Review = {
  id: string;
  rating: number;
  body: string | null;
  /** "Ale K." — reviews are public, so never the reviewer's full name.
   *  Null once the account has been erased. */
  author: string | null;
  /** Snapshotted at write time, so it survives the catalogue moving on. */
  productTitle: string;
  variantLabel: string;
  createdAt: string;
  updatedAt: string;
};

/** `average` is null until someone has actually rated the product. */
export type ProductRating = { average: number | null; count: number };

export type PublicProduct = Omit<Product, "status" | "variants" | "shippingProfileId"> & {
  shop: { name: string; slug: string };
  variants: PublicProductVariant[];
  /** Empty means the seller ships this product free. */
  shippingRates: PublicShippingRate[];
  rating: ProductRating;
  /** Most recent first, capped by the API — the count comes from `rating`. */
  reviews: Review[];
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
  currency: string;
  shop: { name: string; slug: string };
  imageUrl: string | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  rating: ProductRating;
};
