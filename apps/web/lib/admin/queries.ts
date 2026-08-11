import "server-only";
import { redirect } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/queries";
import type { AdminCategory, AdminOverview, AdminUser } from "./types";

/**
 * Sends anyone without admin access home. Checked per page rather than in the
 * layout, since layouts don't re-run between sibling pages — same reasoning
 * as `requireSeller` and `requireStaff`.
 */
export async function requireAdmin(locale: string) {
  const user = await getCurrentUser();
  if (!user?.canAccessAdminPanel) redirect({ href: "/", locale });
  return user!;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await apiFetch<{ data: AdminOverview }>("/api/admin/overview");
  return res.data;
}

export async function getAdminUsers(search: string, role: string): Promise<AdminUser[]> {
  const query = new URLSearchParams({ search, role });
  const res = await apiFetch<{ data: AdminUser[] }>(`/api/admin/users?${query}`);
  return res.data;
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const res = await apiFetch<{ data: AdminCategory[] }>("/api/admin/categories");
  return res.data;
}
