"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { Review } from "./types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type ReviewResult =
  | { review: Review; errors?: undefined }
  | { review?: undefined; errors: ApiErrorItem[] };

/**
 * Written against an order line rather than a product, which is what makes
 * every review a verified purchase — the API rejects anything else.
 */
export async function writeReviewAction(
  orderItemId: string,
  rating: number,
  body: string
): Promise<ReviewResult> {
  try {
    const res = await apiFetch<{ data: Review }>("/api/storefront/reviews", {
      method: "POST",
      body: JSON.stringify({ orderItemId, rating, body: body.trim() || undefined }),
    });
    return { review: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export async function updateReviewAction(
  reviewId: string,
  rating: number,
  body: string
): Promise<ReviewResult> {
  try {
    const res = await apiFetch<{ data: Review }>(`/api/storefront/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify({ rating, body: body.trim() || undefined }),
    });
    return { review: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}
