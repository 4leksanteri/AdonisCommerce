"use server";

import { cookies } from "next/headers";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/format";
import { CURRENCY_COOKIE } from "./currency";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Stores the shopper's display-currency preference. Not httpOnly — it holds
 * nothing sensitive and there's no harm in the client reading it — but it is
 * read server-side so prices render converted on first paint rather than
 * flickering from one currency to another.
 */
export async function setDisplayCurrencyAction(currency: string): Promise<void> {
  if (!SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)) return;

  const store = await cookies();
  store.set(CURRENCY_COOKIE, currency, {
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}
