export type Seller = {
  id: string;
  shopName: string;
  slug: string;
  description: string | null;
  /** Null until the seller uploads one; the UI falls back to initials. */
  avatarUrl: string | null;
  status: string;
  payoutStatus: string;
  currency: string;
  country: string;
  createdAt: string;
};

export type User = {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
  /**
   * The language their emails are written in — a setting on the account, not
   * whichever locale the page they're on happens to use.
   */
  locale: string;
  /**
   * Served by the API rather than derived from `role` — the containment rule
   * (admin includes staff) lives on the server, and one copy of it is enough.
   */
  canAccessStaffPanel: boolean;
  canAccessAdminPanel: boolean;
  initials: string;
  seller: Seller | null;
};
