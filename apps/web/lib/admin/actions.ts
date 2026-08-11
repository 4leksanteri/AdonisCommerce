"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import type { AdminCategory, AdminUser } from "./types";

const GENERIC_ERROR: ApiErrorItem = {
  code: "GENERIC_ERROR",
  message: "Something went wrong.",
};

type UserResult =
  { user: AdminUser; errors?: undefined } | { user?: undefined; errors: ApiErrorItem[] };
type CategoryResult =
  | { category: AdminCategory; errors?: undefined }
  | { category?: undefined; errors: ApiErrorItem[] };

export async function setUserRoleAction(userId: string, role: string): Promise<UserResult> {
  try {
    const res = await apiFetch<{ data: AdminUser }>(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    return { user: res.data };
  } catch (error) {
    return {
      errors: error instanceof ApiError ? error.items : [GENERIC_ERROR],
    };
  }
}

type CategoryInput = {
  position?: number;
  isActive?: boolean;
  /** Slug is derived from the name server-side when left blank. */
  translations: { locale: string; name: string; slug?: string }[];
};

export async function saveCategoryAction(
  id: string | null,
  input: CategoryInput
): Promise<CategoryResult> {
  try {
    const res = await apiFetch<{ data: AdminCategory }>(
      id === null ? "/api/admin/categories" : `/api/admin/categories/${id}`,
      { method: id === null ? "POST" : "PATCH", body: JSON.stringify(input) }
    );
    return { category: res.data };
  } catch (error) {
    return {
      errors: error instanceof ApiError ? error.items : [GENERIC_ERROR],
    };
  }
}
