"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { Seller } from "@/lib/auth/types";
import type { Product, ProductImage } from "./types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type UpdateSellerResult = { seller: Seller; errors?: undefined } | { seller?: undefined; errors: ApiErrorItem[] };

export async function updateSellerAction(shopName: string, description: string, currency?: string): Promise<UpdateSellerResult> {
  try {
    const res = await apiFetch<{ data: Seller }>("/api/sellers/me", {
      method: "PATCH",
      body: JSON.stringify({ shopName, description, currency }),
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
