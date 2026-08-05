export type Seller = {
  id: number;
  shopName: string;
  slug: string;
  description: string | null;
  status: string;
  createdAt: string;
};

export type User = {
  id: number;
  fullName: string | null;
  email: string;
  role: string;
  initials: string;
  seller: Seller | null;
};
