export const ANY_DESTINATION = "*";

/**
 * Destinations offered in the "ship to" picker. A curated list rather than all
 * 249 ISO codes — names are rendered with `Intl.DisplayNames`, so this is only
 * the set we offer, not a translation table.
 */
export const SHIP_TO_COUNTRIES = [
  "FI", "SE", "NO", "DK", "EE", "DE", "FR", "NL", "ES", "IT", "PL", "GB", "IE", "US", "CA", "AU",
] as const;

/**
 * The marketplace's home market. A default has to be *something*, and the
 * picker states it plainly rather than pretending we know where you are.
 */
export const DEFAULT_SHIP_TO = "FI";

export type PublicShippingRate = {
  destination: string;
  firstItemCents: number;
  additionalItemCents: number;
};

/** Mirrors `rateFor` on the API: exact country wins, else the catch-all. */
export function rateFor(rates: PublicShippingRate[], country: string): PublicShippingRate | null {
  const target = country.toUpperCase();

  return (
    rates.find((rate) => rate.destination.toUpperCase() === target) ??
    rates.find((rate) => rate.destination === ANY_DESTINATION) ??
    null
  );
}

/**
 * `first_item + (quantity - 1) x additional_item`, matching the API's
 * calculation so the page can't quote a price checkout won't honour.
 *
 * `null` rates mean the product ships free; an empty result from `rateFor`
 * means this seller doesn't deliver there at all — a different thing.
 */
export function shippingCentsFor(
  rates: PublicShippingRate[],
  country: string,
  quantity: number
): { cents: number; deliverable: boolean } {
  if (rates.length === 0) return { cents: 0, deliverable: true };

  const rate = rateFor(rates, country);
  if (!rate) return { cents: 0, deliverable: false };

  return {
    cents: rate.firstItemCents + rate.additionalItemCents * Math.max(quantity - 1, 0),
    deliverable: true,
  };
}
