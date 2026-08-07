import type { CartItem } from "./types";

const STORAGE_KEY = "cart";

/** Matches MAX_CART_LINES on the API — the request is rejected beyond it. */
export const MAX_LINES = 100;

/**
 * localStorage as an external store, read through `useSyncExternalStore`.
 *
 * The obvious alternative — seeding `useState` from localStorage in an effect
 * — makes the server and client render different markup and needs a setState
 * on mount. Modelling it as a store instead gives React a proper server
 * snapshot, and subscribing to the `storage` event means a second tab's
 * changes show up here for free.
 */

const EMPTY: CartItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY;

const listeners = new Set<() => void>();

function parse(raw: string | null): CartItem[] {
  if (!raw) return EMPTY;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    // Anything could be in localStorage — an older build, another tab, a
    // curious user. Validate rather than trust it into React state.
    return parsed.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as CartItem).variantId === "string" &&
        Number.isInteger((item as CartItem).quantity) &&
        (item as CartItem).quantity > 0
    );
  } catch {
    return EMPTY;
  }
}

/**
 * Must return a referentially stable value when nothing changed, or React
 * re-renders forever — hence caching against the raw string.
 */
export function getSnapshot(): CartItem[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parse(raw);
  }
  return cachedItems;
}

export function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Reads the current value straight from the store rather than closing over
 * React state, so a handler can't write a stale cart back.
 */
export function mutate(update: (previous: CartItem[]) => CartItem[]): void {
  const next = update(getSnapshot());

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  // Force the next read to re-parse; `storage` doesn't fire in the tab that
  // wrote, so this tab's subscribers are notified explicitly.
  cachedRaw = null;
  for (const listener of listeners) listener();
}
