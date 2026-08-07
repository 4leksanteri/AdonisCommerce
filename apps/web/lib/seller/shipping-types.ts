/** `destination` is an ISO country code, or "*" for everywhere else. */
export const ANY_DESTINATION = "*";

export type ShippingRate = {
  id: string;
  destination: string;
  firstItemCents: number;
  additionalItemCents: number;
};

export type ShippingProfile = {
  id: string;
  name: string;
  createdAt: string;
  rates: ShippingRate[];
};

export type ShippingRateInput = {
  destination: string;
  firstItemCents: number;
  additionalItemCents: number;
};
