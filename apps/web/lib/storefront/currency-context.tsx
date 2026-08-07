"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ExchangeRates } from "@/lib/format";

type DisplayCurrencyValue = {
  /** Null until the shopper picks one — show each price in its own currency. */
  displayCurrency: string | null;
  rates: ExchangeRates;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyValue>({
  displayCurrency: null,
  rates: {},
});

/**
 * Resolved once per request in the root layout and handed to client
 * components here. Server components read `getDisplayCurrency` /
 * `getExchangeRates` directly instead — they can't consume a context, and
 * both routes end up at the same cookie and the same cached rates.
 */
export function DisplayCurrencyProvider({
  displayCurrency,
  rates,
  children,
}: DisplayCurrencyValue & { children: ReactNode }) {
  return (
    <DisplayCurrencyContext.Provider value={{ displayCurrency, rates }}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency() {
  return useContext(DisplayCurrencyContext);
}
