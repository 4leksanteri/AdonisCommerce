/** Which end of the conversation the reader is on. */
export type DirectRole = "buyer" | "seller";

/**
 * The other party, from the reader's side: a buyer is talking to a shop,
 * which has a name and a page; a seller is talking to a person, who has
 * neither. `name` is null once an account has been anonymised.
 */
export type ConversationParty = {
  name: string | null;
  slug: string | null;
  avatarUrl: string | null;
};

export type ConversationSummary = {
  id: string;
  with: ConversationParty;
  lastMessageAt: string | null;
  excerpt: string | null;
  lastSenderRole: DirectRole | null;
  isUnread: boolean;
};

export type DirectMessage = {
  id: string;
  senderRole: DirectRole;
  senderName: string | null;
  body: string;
  createdAt: string;
};

export type Inbox = {
  conversations: ConversationSummary[];
  unread: number;
  page: number;
  lastPage: number;
};

export type ConversationThread = {
  conversation: ConversationSummary;
  messages: DirectMessage[];
  role: DirectRole;
};

/** Unread conversations per inbox, for the nav badge. */
export type UnreadCounts = { buyer: number; seller: number };
