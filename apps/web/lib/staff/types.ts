import type { OrderItem } from "@/lib/orders/types";
import type { DisputeReason } from "@/lib/orders/types";

export type DisputeStatus = "open" | "resolved_refunded" | "resolved_released" | "withdrawn";

/**
 * Everything needed to settle a dispute without leaving the page. Carries
 * names and email addresses, which is why the panel is gated.
 */
export type StaffDispute = {
  id: string;
  reason: DisputeReason;
  detail: string | null;
  status: DisputeStatus;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  openedBy: { name: string | null; email: string | null };
  resolvedBy: { name: string | null; email: string } | null;
  order: {
    id: string;
    reference: string;
    sellerOrderNumber: number;
    status: string;
    currency: string;
    totalCents: number;
    refundedCents: number;
    /** False means the money is still held, which makes refunding cheap. */
    isPaidOut: boolean;
    shippedAt: string | null;
    trackingNumber: string | null;
    shopName: string;
    buyerName: string;
    buyerEmail: string;
    items: OrderItem[];
  };
};

/**
 * Only figures somebody acts on. Revenue and order counts belong to whoever
 * runs the business, not to whoever is settling a case.
 */
export type StaffOverview = {
  openDisputes: number;
  /** When the longest-waiting open case was raised; null when there are none. */
  oldestDisputeAt: string | null;
  settledLastWeek: number;
  /** Finished orders that never paid out — the sweep retries, so a persistent
   *  number means something is failing repeatedly. */
  stuckPayouts: number;
  /** Grouped by currency: adding euros to kronor gives a number that looks
   *  right and means nothing. */
  heldPayouts: { currency: string; orders: number; cents: number }[];
};
