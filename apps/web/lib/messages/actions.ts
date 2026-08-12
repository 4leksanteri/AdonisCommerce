"use server";

import { apiFetch, ApiError, type ApiErrorItem } from "@/lib/api";
import { getUnreadCounts } from "./queries";
import type { ConversationSummary, UnreadCounts } from "./types";

const GENERIC_ERROR: ApiErrorItem = { code: "GENERIC_ERROR", message: "Something went wrong." };

type StartResult =
  | { conversation: ConversationSummary; errors?: undefined }
  | { conversation?: undefined; errors: ApiErrorItem[] };

type ReplyResult = { ok: true; errors?: undefined } | { ok?: undefined; errors: ApiErrorItem[] };

/**
 * "Contact shop". Addressed by slug rather than conversation id because the
 * shopper has no idea whether they have written to this shop before — the
 * API finds the thread or starts one.
 */
export async function startConversationAction(
  shopSlug: string,
  body: string
): Promise<StartResult> {
  try {
    const res = await apiFetch<{ data: { conversation: ConversationSummary } }>(
      "/api/conversations",
      { method: "POST", body: JSON.stringify({ shopSlug, body }) }
    );
    return { conversation: res.data.conversation };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

export async function replyAction(conversationId: string, body: string): Promise<ReplyResult> {
  try {
    await apiFetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    return { ok: true };
  } catch (error) {
    return { errors: error instanceof ApiError ? error.items : [GENERIC_ERROR] };
  }
}

/**
 * The header's badge asks for this itself rather than being handed it by a
 * layout: the root layout renders once per full page load and never again on
 * client navigation, so a count threaded down from there would freeze on its
 * first value and never clear as threads are read.
 */
export async function unreadCountsAction(): Promise<UnreadCounts> {
  return getUnreadCounts();
}
