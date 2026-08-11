import "server-only";
import { redirect } from "@/i18n/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/queries";
import type { StaffDispute, StaffOverview } from "./types";

/**
 * Sends anyone without staff access home. Called from the pages rather than
 * the layout, since layouts don't re-run on client-side navigation between
 * sibling pages — same reasoning as `requireSeller`.
 */
export async function requireStaff(locale: string) {
  const user = await getCurrentUser();

  if (!user?.canAccessStaffPanel) {
    redirect({ href: "/", locale });
  }

  return user!;
}

export async function getDisputes(status = "open"): Promise<StaffDispute[]> {
  const res = await apiFetch<{ data: StaffDispute[] }>(
    `/api/staff/disputes?status=${encodeURIComponent(status)}`
  );
  return res.data;
}

export async function getDispute(id: string): Promise<StaffDispute | null> {
  try {
    const res = await apiFetch<{ data: StaffDispute }>(`/api/staff/disputes/${id}`);
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getStaffOverview(): Promise<StaffOverview> {
  const res = await apiFetch<{ data: StaffOverview }>("/api/staff/overview");
  return res.data;
}
