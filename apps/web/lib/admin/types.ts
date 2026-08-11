export type AdminOverview = {
  users: { total: number; team: number; newThisWeek: number };
  /** `payable` is how many shops can actually take money — see the API. */
  shops: { total: number; payable: number };
  listings: { active: number; uncategorised: number };
  /** Grouped by currency; summing them would mean nothing. */
  commission: { currency: string; orders: number; cents: number }[];
};

export type AdminUser = {
  id: string;
  fullName: string | null;
  email: string;
  role: "customer" | "staff" | "admin";
  createdAt: string;
  shop: { name: string; slug: string } | null;
  roleChangedAt: string | null;
  roleChangedBy: string | null;
};

export type AdminCategory = {
  id: string;
  position: number;
  isActive: boolean;
  productCount: number;
  translations: { locale: string; name: string; slug: string }[];
};
