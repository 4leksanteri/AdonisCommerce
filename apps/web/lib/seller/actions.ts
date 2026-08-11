"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { Seller } from "@/lib/auth/types";
import type { SellerOrder } from "@/lib/orders/types";
import type { Product, ProductImage } from "./types";
import type { ShippingProfile, ShippingRateInput } from "./shipping-types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type UpdateSellerResult = { seller: Seller; errors?: undefined } | { seller?: undefined; errors: ApiErrorItem[] };

export async function updateSellerAction(
  shopName: string,
  description: string,
  currency?: string,
  country?: string
): Promise<UpdateSellerResult> {
  try {
    const res = await apiFetch<{ data: Seller }>("/api/sellers/me", {
      method: "PATCH",
      body: JSON.stringify({ shopName, description, currency, country }),
    });
    return { seller: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export type CreateProductInput = {
  title: string;
  description: string;
  // Omitted by the create flow, which lets the API publish the product.
  status?: "active" | "archived";
  tracksInventory?: boolean;
  /** Null ships the product free. */
  shippingProfileId?: string | null;
  categoryId: string;
  options: { name: string; values: string[] }[];
  variants: { optionValues: string[]; sku: string; priceCents: number; stockQuantity: number }[];
};

type CreateProductResult = { product: Product; errors?: undefined } | { product?: undefined; errors: ApiErrorItem[] };

export async function createProductAction(input: CreateProductInput): Promise<CreateProductResult> {
  try {
    const res = await apiFetch<{ data: Product }>("/api/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { product: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export async function updateProductAction(
  productId: string,
  input: CreateProductInput
): Promise<CreateProductResult> {
  try {
    const res = await apiFetch<{ data: Product }>(`/api/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return { product: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

type CreateDraftProductResult = { product: Product; errors?: undefined } | { product?: undefined; errors: ApiErrorItem[] };

export async function createDraftProductAction(): Promise<CreateDraftProductResult> {
  try {
    const res = await apiFetch<{ data: Product }>("/api/products/draft", { method: "POST" });
    return { product: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

type UploadProductImagesResult =
  | { images: ProductImage[]; errors?: undefined }
  | { images?: undefined; errors: ApiErrorItem[] };

export async function uploadProductImagesAction(
  productId: string,
  formData: FormData
): Promise<UploadProductImagesResult> {
  try {
    const res = await apiFetch<{ data: ProductImage[] }>(`/api/products/${productId}/images`, {
      method: "POST",
      body: formData,
    });
    return { images: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

type DeleteProductImageResult = { errors?: ApiErrorItem[] };

export async function deleteProductImageAction(
  productId: string,
  imageId: string
): Promise<DeleteProductImageResult> {
  try {
    await apiFetch<void>(`/api/products/${productId}/images/${imageId}`, { method: "DELETE" });
    return {};
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

type ShippingProfileResult =
  | { profile: ShippingProfile; errors?: undefined }
  | { profile?: undefined; errors: ApiErrorItem[] };

export async function saveShippingProfileAction(
  id: string | null,
  name: string,
  rates: ShippingRateInput[]
): Promise<ShippingProfileResult> {
  try {
    const res = await apiFetch<{ data: ShippingProfile }>(
      id === null ? "/api/shipping-profiles" : `/api/shipping-profiles/${id}`,
      { method: id === null ? "POST" : "PATCH", body: JSON.stringify({ name, rates }) }
    );
    return { profile: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export async function deleteShippingProfileAction(id: string): Promise<{ errors?: ApiErrorItem[] }> {
  try {
    await apiFetch<void>(`/api/shipping-profiles/${id}`, { method: "DELETE" });
    return {};
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

/** Multipart, so the boundary has to come from FormData — see `apiFetch`. */
export async function uploadShopAvatarAction(formData: FormData): Promise<UpdateSellerResult> {
  try {
    const res = await apiFetch<{ data: Seller }>("/api/sellers/me/avatar", {
      method: "POST",
      body: formData,
    });
    return { seller: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export async function removeShopAvatarAction(): Promise<UpdateSellerResult> {
  try {
    const res = await apiFetch<{ data: Seller }>("/api/sellers/me/avatar", { method: "DELETE" });
    return { seller: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

type SellerOrderResult =
  | { order: SellerOrder; errors?: undefined }
  | { order?: undefined; errors: ApiErrorItem[] };

/** The seller committing to make and send the thing. */
export async function acceptOrderAction(orderId: string): Promise<SellerOrderResult> {
  return orderAction(`/api/orders/${orderId}/accept`, {});
}

export async function shipOrderAction(
  orderId: string,
  trackingNumber: string
): Promise<SellerOrderResult> {
  return orderAction(`/api/orders/${orderId}/ship`, {
    trackingNumber: trackingNumber.trim() || undefined,
  });
}

/**
 * Cancelling refunds the buyer in the same step — there is no version of this
 * that calls the order off and keeps the money.
 */
export async function cancelOrderAction(
  orderId: string,
  reason: string
): Promise<SellerOrderResult> {
  return orderAction(`/api/orders/${orderId}/cancel`, { reason: reason.trim() || undefined });
}

async function orderAction(path: string, body: object): Promise<SellerOrderResult> {
  try {
    const res = await apiFetch<{ data: SellerOrder }>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { order: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

type PayoutLinkResult = { url: string; errors?: undefined } | { url?: undefined; errors: ApiErrorItem[] };

/**
 * Mints a one-time link into Stripe's hosted onboarding. Account Links expire
 * within minutes and can only be opened once, so this runs on the button
 * press rather than when the page loads.
 */
export async function startPayoutOnboardingAction(locale: string): Promise<PayoutLinkResult> {
  try {
    const res = await apiFetch<{ data: { url: string } }>("/api/sellers/me/payouts/onboarding", {
      method: "POST",
      body: JSON.stringify({ locale }),
    });
    return { url: res.data.url };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

/** One-time sign-in to the Express dashboard, where Stripe shows payouts. */
export async function openPayoutDashboardAction(): Promise<PayoutLinkResult> {
  try {
    const res = await apiFetch<{ data: { url: string } }>("/api/sellers/me/payouts/dashboard", {
      method: "POST",
    });
    return { url: res.data.url };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}
