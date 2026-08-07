"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { hydrateCartAction } from "./actions";
import { getServerSnapshot, getSnapshot, MAX_LINES, mutate, subscribe } from "./store";
import type { CartItem, CartLine, UnavailableLine } from "./types";

type CartContextValue = {
  items: CartItem[];
  lines: CartLine[];
  /** Stored items the API no longer returns: delisted, archived or removed. */
  unavailable: UnavailableLine[];
  isLoading: boolean;
  /** Distinct products in the cart, not total units. */
  lineCount: number;
  add: (variantId: string, quantity: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const NO_LINES: CartLine[] = [];

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Tagged with the variant set it was fetched for, which lets both `lines`
  // and `isLoading` be derived instead of tracked — no setState in an effect.
  const [fetched, setFetched] = useState<{ key: string; lines: CartLine[] }>({
    key: "",
    lines: NO_LINES,
  });

  /**
   * Only the *set* of variants drives a refetch. Changing a quantity is
   * arithmetic the client can do alone, and refetching on every press of a
   * stepper button would be a request per keystroke.
   */
  const variantKey = useMemo(
    () =>
      items
        .map((item) => item.variantId)
        .sort()
        .join(","),
    [items]
  );

  useEffect(() => {
    if (variantKey === "") return;

    let cancelled = false;

    hydrateCartAction(variantKey.split(",").map((variantId) => ({ variantId, quantity: 1 })))
      .then((lines) => {
        if (!cancelled) setFetched({ key: variantKey, lines });
      });

    // A slow response for an older cart must not overwrite a newer one.
    return () => {
      cancelled = true;
    };
  }, [variantKey]);

  const isLoading = variantKey !== "" && fetched.key !== variantKey;

  /**
   * Filtered against the live item list rather than waiting for a refetch, so
   * removing something disappears immediately while an addition still shows
   * the previous lines instead of flashing an empty cart.
   */
  const lines = useMemo(
    () => fetched.lines.filter((line) => items.some((item) => item.variantId === line.variantId)),
    [fetched.lines, items]
  );

  const add = useCallback((variantId: string, quantity: number) => {
    mutate((previous) => {
      const existing = previous.find((item) => item.variantId === variantId);
      if (existing) {
        return previous.map((item) =>
          item.variantId === variantId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      if (previous.length >= MAX_LINES) return previous;
      return [...previous, { variantId, quantity }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    mutate((previous) =>
      quantity <= 0
        ? previous.filter((item) => item.variantId !== variantId)
        : previous.map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    mutate((previous) => previous.filter((item) => item.variantId !== variantId));
  }, []);

  const clear = useCallback(() => mutate(() => []), []);

  const unavailable = useMemo(
    () => items.filter((item) => !lines.some((line) => line.variantId === item.variantId)),
    [items, lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      lines,
      // Everything looks unavailable mid-fetch; don't flash that at people.
      unavailable: isLoading ? [] : unavailable,
      isLoading,
      lineCount: items.length,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, lines, unavailable, isLoading, add, setQuantity, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
