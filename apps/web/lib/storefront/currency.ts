import "server-only";
import { cookies } from "next/headers";
import { SUPPORTED_CURRENCIES, type ExchangeRates, type SupportedCurrency } from "@/lib/format";
import { DEFAULT_SHIP_TO, SHIP_TO_COUNTRIES } from "./shipping";

export const CURRENCY_COOKIE = "display_currency";

/**
 * The shopper's chosen display currency, or null when they haven't chosen.
 *
 * Null deliberately means "show each price in the currency its seller set"
 * rather than defaulting to EUR — an unconverted price is always exactly
 * right, so it's the safer thing to show to someone who hasn't asked.
 */
export async function getDisplayCurrency(): Promise<SupportedCurrency | null> {
  const store = await cookies();
  const value = store.get(CURRENCY_COOKIE)?.value;

  return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)
    ? (value as SupportedCurrency)
    : null;
}

/**
 * ECB reference rates via our API, which owns the upstream caching. Fetched
 * directly rather than through `apiFetch` because that pins `cache:
 * "no-store"` for authenticated data — rates are public and want caching,
 * same as translations in `i18n/request.ts`.
 *
 * Failures degrade to an empty set rather than throwing: `convertCents`
 * returns null for unknown rates, so the storefront quietly falls back to
 * native currencies instead of the page erroring.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    const res = await fetch(`${process.env.API_INTERNAL_URL}/api/storefront/exchange-rates`, {
      next: { revalidate: 3600, tags: ["exchange-rates"] },
    });
    if (!res.ok) return {};

    const body: { rates?: ExchangeRates } = await res.json();
    return body.rates ?? {};
  } catch {
    return {};
  }
}

export const SHIP_TO_COOKIE = "ship_to";

/**
 * Where the shopper wants things delivered, for quoting shipping before
 * checkout. Falls back to the marketplace's home market — the picker shows
 * the assumption rather than hiding it.
 */
export async function getShipToCountry(): Promise<string> {
  const store = await cookies();
  const value = store.get(SHIP_TO_COOKIE)?.value?.toUpperCase();

  return value && (SHIP_TO_COUNTRIES as readonly string[]).includes(value)
    ? value
    : DEFAULT_SHIP_TO;
}
