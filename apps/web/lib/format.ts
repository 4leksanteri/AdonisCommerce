/**
 * Shared options for next-intl's number formatter, so every price in the
 * app renders identically and follows the active locale — "€1,999.00" in
 * English, "1 999,00 €" in Finnish. Hardcoding `€${n.toFixed(2)}` gets both
 * the separators and the symbol placement wrong outside en.
 *
 * Pair with `useFormatter()` in client components or `getFormatter()` in
 * server ones: `format.number(value, CURRENCY_FORMAT)`.
 */
export const CURRENCY_FORMAT = { style: "currency", currency: "EUR" } as const;
