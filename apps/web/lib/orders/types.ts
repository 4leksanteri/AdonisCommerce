export type OrderItem = {
  id: string;
  productTitle: string;
  productSlug: string;
  /** "Lavender / Small", or empty for a product without options. */
  variantLabel: string;
  imageUrl: string | null;
  unitPriceCents: number;
  currency: string;
  quantity: number;
};

export type ShippingAddress = {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
};

/**
 * ```
 * pending_payment ─paid─> paid ─accept─> accepted ─ship─> shipped ─┬─> completed
 *        │                  │                │                     │      ↑
 *        ├─ expired         └───── cancel ───┘                  disputed ─┘
 *        └─ cancelled
 * ```
 *
 * The seller's money is held until `completed` — the buyer confirming
 * receipt, or the hold lapsing after dispatch.
 *
 * `pending` also exists on orders placed before payments were added; it is
 * not reachable any more but old rows still carry it.
 */
export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "paid"
  | "accepted"
  | "shipped"
  | "disputed"
  | "completed"
  | "cancelled"
  | "expired";

export type DisputeReason = "not_received" | "damaged" | "not_as_described" | "other";

export type Dispute = {
  id: string;
  reason: DisputeReason;
  detail: string | null;
  status: "open" | "resolved_refunded" | "resolved_released" | "withdrawn";
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

/**
 * One order per seller. Every buyer-facing figure here is a snapshot taken at
 * purchase time, not a live lookup — see the order_items migration.
 */
export type Order = {
  id: string;
  reference: string;
  /** Per-shop running number for humans; `reference` stays canonical. */
  sellerOrderNumber: number;
  status: OrderStatus;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  /** What actually came back, which is zero unless money had already moved. */
  refundedCents: number;
  isRefunded: boolean;
  trackingNumber: string | null;
  cancelReason: string | null;
  createdAt: string;
  acceptedAt: string | null;
  shippedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  /** When the order closes on its own if the buyer never confirms. */
  payoutReleaseAt: string | null;
  actions: {
    canConfirmReceipt: boolean;
    canReportProblem: boolean;
    canWithdrawProblem: boolean;
  };
  disputes: Dispute[];
  shop: { name: string; slug: string };
  shipping: ShippingAddress;
  contactEmail: string;
  items: OrderItem[];
};

/**
 * The seller's view: the same order plus who bought it, what the shop earns,
 * and which actions the API will accept.
 *
 * `actions` is served rather than derived here on purpose. The state machine
 * lives on the server, and a second copy in the browser would drift and start
 * offering buttons that 409.
 */
export type SellerOrder = Omit<Order, "shop" | "contactEmail" | "actions"> & {
  platformFeeCents: number;
  /** False until the order completes — the payout is held until then. */
  isPaidOut: boolean;
  payoutCents: number;
  /** False on a refunded order means the shop's share couldn't be clawed back. */
  transferReversed: boolean;
  buyer: { name: string; email: string };
  actions: { canAccept: boolean; canShip: boolean; canCancel: boolean };
};

export type ShippingInput = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
};
