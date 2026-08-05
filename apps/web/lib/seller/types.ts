export type ProductOptionValue = {
  id: number;
  value: string;
  position: number;
};

export type ProductOption = {
  id: number;
  name: string;
  position: number;
  values: ProductOptionValue[];
};

export type ProductVariant = {
  id: number;
  sku: string | null;
  price: string;
  stockQuantity: number;
  createdAt: string;
  optionValues: ProductOptionValue[];
};

export type ProductImage = {
  id: number;
  position: number;
  url: string;
};

export type Product = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  createdAt: string;
  options: ProductOption[];
  variants: ProductVariant[];
  images: ProductImage[];
};
