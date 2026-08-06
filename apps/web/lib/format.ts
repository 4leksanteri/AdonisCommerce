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
