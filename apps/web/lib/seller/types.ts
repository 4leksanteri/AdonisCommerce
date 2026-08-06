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
  createdAt: string;
  options: ProductOption[];
  variants: ProductVariant[];
  images: ProductImage[];
};
