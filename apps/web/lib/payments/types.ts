/**
 * One card charge. A basket spanning three shops is three orders but a single
 * payment — unless the shops price in different currencies, in which case
 * there is one payment per currency, because a Stripe PaymentIntent carries
 * exactly one.
 */
export type Payment = {
  id: string;
  currency: string;
  /** Minor units, covering every order this payment settles. */
  amountCents: number;
  /** Stripe's own PaymentIntent status, stored verbatim. */
  status: string;
  /**
   * Authorises the browser to confirm this one payment. Returned only on the
   * response that created it, and never persisted anywhere.
   */
  clientSecret: string | null;
};

/** What the seller panel needs to explain the state of payouts. */
export type PayoutDetails = {
  payoutStatus: "not_connected" | "connected" | "restricted";
  hasAccount: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  /** Stripe's reason for switching the account off, e.g. "requirements.past_due". */
  disabledReason: string | null;
  /** Stripe is checking documents the seller has already handed over. */
  pendingVerification: boolean;
  /** The platform's commission in basis points — 650 is 6.5%. */
  platformFeeBps: number;
};
