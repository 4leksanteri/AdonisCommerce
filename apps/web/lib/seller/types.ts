/**
 * Mirrors MAX_IMAGES in the API's product validator, which is the authority —
 * this only avoids offering an upload that would be refused.
 */
export const MAX_IMAGES = 10;

export type ProductOptionValue = {
  id: string;
  value: string;
  position: number;
};

export type ProductOption = {
  id: string;
  name: string;
  position: number;
  values: ProductOptionValue[];
};

export type ProductVariant = {
  id: string;
  sku: string | null;
  /** Minor units — 1250 is €12.50. See lib/format.ts. */
  priceCents: number;
  stockQuantity: number;
  createdAt: string;
  optionValues: ProductOptionValue[];
};

export type ProductImage = {
  id: string;
  position: number;
  url: string;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  currency: string;
  /** False for made-to-order and digital listings — stockQuantity is ignored. */
  tracksInventory: boolean;
  /** Null means the seller ships this product free. */
  shippingProfileId: string | null;
  /** Null only on products that predate the taxonomy. */
  categoryId: string | null;
  createdAt: string;
  options: ProductOption[];
  variants: ProductVariant[];
  images: ProductImage[];
};

/** A category in the caller's language — see the API's CategoryTransformer. */
export type Category = {
  id: string;
  name: string;
  slug: string;
};

/** What the seller panel's summary cards read. See OrdersController.stats. */
export type OrderStats = {
  currency: string;
  days: number;
  orders: { total: number; previous: number; series: number[] };
  sales: { total: number; previous: number; series: number[] };
  openProblems: number;
  /** Visible statuses this shop actually has, keyed by status. */
  statusCounts: Record<string, number>;
};
