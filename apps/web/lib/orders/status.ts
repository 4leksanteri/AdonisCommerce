import type { OrderStatus } from "./types";

/**
 * One mapping for both audiences. `paid` reads as "waiting on someone" from
 * either side — the shop still has to accept, and the buyer is still waiting
 * to hear — so it carries the same weight in both panels.
 */
const COLORS: Record<OrderStatus, "success" | "warning" | "danger" | undefined> = {
  pending: undefined,
  pending_payment: "warning",
  paid: "warning",
  accepted: undefined,
  shipped: "success",
  // Someone is waiting on an answer, same as `paid` — not a failure yet.
  disputed: "warning",
  completed: "success",
  cancelled: "danger",
  expired: "danger",
};

export function orderStatusColor(status: OrderStatus) {
  return COLORS[status];
}
