import "server-only";
import { apiFetch, ApiError } from "@/lib/api";
import type { ConversationThread, DirectRole, Inbox, UnreadCounts } from "./types";

/** The reader's inbox, from whichever side they asked for. */
export async function getInbox(role: DirectRole): Promise<Inbox> {
  const query = role === "seller" ? "?as=seller" : "";
  const res = await apiFetch<{ data: Inbox }>(`/api/conversations${query}`);
  return res.data;
}

/**
 * One thread. Null on 404, which is also what someone else's conversation
 * looks like — the API does not confirm that it exists.
 */
export async function getConversationThread(id: string): Promise<ConversationThread | null> {
  try {
    const res = await apiFetch<{ data: ConversationThread }>(`/api/conversations/${id}`);
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401)) return null;
    throw error;
  }
}

/**
 * What each inbox has waiting, for the nav badge. Its own endpoint rather
 * than counting the inbox response, which only ever knows about the page of
 * conversations it loaded.
 */
export async function getUnreadCounts(): Promise<UnreadCounts> {
  try {
    const res = await apiFetch<{ data: UnreadCounts }>("/api/conversations/unread");
    return res.data;
  } catch (error) {
    // A badge is not worth failing a page render over.
    if (error instanceof ApiError) return { buyer: 0, seller: 0 };
    throw error;
  }
}
