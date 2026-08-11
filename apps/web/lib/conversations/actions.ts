"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { OrderMessage } from "./types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type SendResult =
  | { message: OrderMessage; errors?: undefined }
  | { message?: undefined; errors: ApiErrorItem[] };

export async function sendMessageAction(orderId: string, body: string): Promise<SendResult> {
  try {
    const res = await apiFetch<{ data: OrderMessage }>(`/api/order-messages/${orderId}`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    return { message: res.data };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}
