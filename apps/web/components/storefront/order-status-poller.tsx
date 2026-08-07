"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

const INTERVAL_MS = 2_000;
const GIVE_UP_AFTER_MS = 60_000;

/**
 * Re-fetches the order while it is still waiting to be marked paid.
 *
 * The browser finishes `confirmPayment` and lands here immediately, but the
 * order only becomes `paid` when Stripe's webhook reaches the API — a second
 * or two later, and over a completely different connection. Without this the
 * buyer would be looking at "awaiting payment" for a payment they just made.
 *
 * Rendered only for unpaid orders, so it unmounts (and stops) the moment the
 * status changes. The time limit is for the case where the webhook never
 * arrives at all: better a stale page than a tab polling until it's closed.
 */
export function OrderStatusPoller() {
  const router = useRouter();

  useEffect(() => {
    const startedAt = Date.now();

    const timer = setInterval(() => {
      if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
        clearInterval(timer);
        return;
      }
      router.refresh();
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [router]);

  return null;
}
