/**
 * What the browser persists. Deliberately just an id and a count — caching
 * prices locally means eventually showing one price and charging another.
 */
export type CartItem = {
  variantId: string;
  quantity: number;
};

/** A line hydrated from the API, carrying the current price and stock. */
export type CartLine = {
  variantId: string;
  productTitle: string;
  productSlug: string;
  shopName: string;
  shopSlug: string;
  currency: string;
  tracksInventory: boolean;
  imageUrl: string | null;
  priceCents: number;
  stockQuantity: number;
  optionValues: string[];
};

/** A stored item the API didn't return — delisted, archived or sold out. */
export type UnavailableLine = { variantId: string; quantity: number };
