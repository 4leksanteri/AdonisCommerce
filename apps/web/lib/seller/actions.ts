"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { Seller } from "@/lib/auth/types";
import type { Product } from "./types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type UpdateSellerResult = { seller: Seller; errors?: undefined } | { seller?: undefined; errors: ApiErrorItem[] };

export async function updateSellerAction(shopName: string, description: string): Promise<UpdateSellerResult> {
  try {
    const res = await apiFetch<{ data: Seller }>("/api/sellers/me", {
      method: "PATCH",
      body: JSON.stringify({ shopName, description }),
    });
    return { seller: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export type CreateProductInput = {
  title: string;
  description: string;
  options: { name: string; values: string[] }[];
  variants: { optionValues: string[]; sku: string; price: number; stockQuantity: number }[];
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
