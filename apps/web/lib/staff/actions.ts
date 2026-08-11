"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { StaffDispute } from "./types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type ResolveResult =
  | { dispute: StaffDispute; errors?: undefined }
  | { dispute?: undefined; errors: ApiErrorItem[] };

/** Side with the buyer: refund in full and call the order off. */
export async function refundDisputeAction(id: string, note: string): Promise<ResolveResult> {
  return resolve(`/api/staff/disputes/${id}/refund`, note);
}

/** Side with the seller: close the case and let the held payout go through. */
export async function releaseDisputeAction(id: string, note: string): Promise<ResolveResult> {
  return resolve(`/api/staff/disputes/${id}/release`, note);
}

async function resolve(path: string, note: string): Promise<ResolveResult> {
  try {
    const res = await apiFetch<{ data: StaffDispute }>(path, {
      method: "POST",
      body: JSON.stringify({ note: note.trim() || undefined }),
    });
    return { dispute: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}
