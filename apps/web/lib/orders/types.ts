export type OrderItem = {
  id: string;
  productTitle: string;
  productSlug: string;
  /** "Lavender / Small", or empty for a product without options. */
  variantLabel: string;
  imageUrl: string | null;
  unitPriceCents: number;
  currency: string;
  quantity: number;
};

export type ShippingAddress = {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
};

/**
 * One order per seller. Every buyer-facing figure here is a snapshot taken at
 * purchase time, not a live lookup — see the order_items migration.
 */
export type Order = {
  id: string;
  reference: string;
  status: string;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  shop: { name: string; slug: string };
  shipping: ShippingAddress;
  contactEmail: string;
  items: OrderItem[];
};

export type ShippingInput = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
};
