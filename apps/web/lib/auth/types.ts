export type Seller = {
  id: string;
  shopName: string;
  slug: string;
  description: string | null;
  status: string;
  payoutStatus: string;
  createdAt: string;
};

export type User = {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
  initials: string;
  seller: Seller | null;
};
