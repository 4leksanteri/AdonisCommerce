/**
 * Currencies a seller can price in.
 *
 * Deliberately limited to two-decimal currencies for now, so "minor units"
 * is uniformly `major × 100` across the app. Adding a zero-decimal currency
 * (JPY, KRW) or a three-decimal one (KWD, BHD) means introducing a per-
 * currency exponent table and auditing every place that divides by 100 —
 * worth doing when a seller actually needs it, not before.
 */
export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'SEK', 'NOK', 'DKK', 'PLN'] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export const DEFAULT_CURRENCY: SupportedCurrency = 'EUR'
