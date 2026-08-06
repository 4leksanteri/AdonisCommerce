/**
 * Currencies a seller can price in — mirrors SUPPORTED_CURRENCIES on the API.
 * All two-decimal for now, which is why `MINOR_UNITS_PER_MAJOR` can be a flat
 * 100; adding JPY or KWD means a per-currency exponent instead.
 */
export const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "SEK", "NOK", "DKK", "PLN"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "EUR";

const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Money is stored and sent as integer minor units (1250 = €12.50) so it never
 * travels as a float — see the price_cents migration. The division to major
 * units happens here, at the last moment before display, and nowhere else.
 */
export function toMajorUnits(cents: number): number {
  return cents / MINOR_UNITS_PER_MAJOR;
}

export function toMinorUnits(major: number): number {
  return Math.round(major * MINOR_UNITS_PER_MAJOR);
}

/**
 * Options for next-intl's number formatter. The locale drives the layout
 * ("€1,999.00" vs "1 999,00 €") and the product's own currency drives the
 * symbol, so both have to be passed rather than hardcoded.
 *
 * Pair with `useFormatter()` in client components or `getFormatter()` in
 * server ones: `format.number(toMajorUnits(cents), currencyFormat(ccy))`.
 */
export function currencyFormat(currency: string) {
  return { style: "currency", currency } as const;
}

/** Rates per 1 EUR, as published by the ECB — `{ EUR: 1, USD: 1.1554 }`. */
export type ExchangeRates = Record<string, number>;

/**
 * Converts between two currencies via EUR, since that's the base the rates
 * are quoted against. Returns null when either rate is missing, which the
 * callers render as "show the original price" — a price in the wrong
 * currency is far worse than one the shopper has to convert themselves.
 *
 * Deliberately does not round to "nice" numbers. €19.99 becoming $23.09 is
 * honest; nudging it to $22.99 would be inventing a price nobody set.
 */
export function convertCents(
  cents: number,
  from: string,
  to: string,
  rates: ExchangeRates
): number | null {
  if (from === to) return cents;

  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return null;

  return Math.round((cents / fromRate) * toRate);
}
