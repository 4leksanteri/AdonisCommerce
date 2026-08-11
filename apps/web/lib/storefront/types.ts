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
  /**
   * Live, and only for linking back. Null where the product isn't preloaded —
   * on a product's own page, where linking to itself would be pointless.
   */
  productSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

/** `average` is null until someone has actually rated the product. */
export type ProductRating = { average: number | null; count: number };

export type PublicProduct = Omit<Product, "status" | "variants" | "shippingProfileId"> & {
  shop: { name: string; slug: string; avatarUrl: string | null };
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
  shop: { name: string; slug: string; avatarUrl: string | null };
  imageUrl: string | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  rating: ProductRating;
};

/**
 * A shop as a shopper sees it. Narrower than the seller's own view — whether
 * a shop's payouts are in order is nobody else's business.
 */
export type PublicShop = {
  name: string;
  slug: string;
  description: string | null;
  /**
   * ISO 3166-1 alpha-2. Rendered beside a standalone label, never inside a
   * sentence — Finnish inflects place names and no API produces the endings.
   */
  country: string;
  /** Null until the seller uploads one; the UI falls back to initials. */
  avatarUrl: string | null;
  memberSince: string;
};

export type ShopPage = {
  shop: PublicShop;
  /** Every review of this shop's products, combined. */
  rating: ProductRating;
  reviews: Review[];
  products: PublicProductCard[];
  total: number;
  page: number;
  lastPage: number;
};
