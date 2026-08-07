"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ExchangeRates } from "@/lib/format";
import { DEFAULT_SHIP_TO } from "./shipping";

type StorefrontPreferences = {
  /** Null until the shopper picks one — show each price in its own currency. */
  displayCurrency: string | null;
  rates: ExchangeRates;
  /** Destination used to quote shipping before checkout. */
  shipToCountry: string;
};

const StorefrontPreferencesContext = createContext<StorefrontPreferences>({
  displayCurrency: null,
  rates: {},
  shipToCountry: DEFAULT_SHIP_TO,
});

/**
 * Resolved once per request in the root layout and handed to client
 * components here. Server components read `getDisplayCurrency` /
 * `getExchangeRates` directly instead — they can't consume a context, and
 * both routes end up at the same cookie and the same cached rates.
 */
export function StorefrontPreferencesProvider({
  displayCurrency,
  rates,
  shipToCountry,
  children,
}: StorefrontPreferences & { children: ReactNode }) {
  return (
    <StorefrontPreferencesContext.Provider value={{ displayCurrency, rates, shipToCountry }}>
      {children}
    </StorefrontPreferencesContext.Provider>
  );
}

export function useStorefrontPreferences() {
  return useContext(StorefrontPreferencesContext);
}
