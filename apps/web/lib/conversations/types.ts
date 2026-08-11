export type SenderRole = "buyer" | "seller" | "staff";

export type OrderMessage = {
  id: string;
  senderRole: SenderRole;
  /** First name only, and null for staff — they appear by role. */
  senderName: string | null;
  body: string;
  createdAt: string;
};

/**
 * `canPost` is served rather than derived. Who may write depends on the
 * order, the reader's role and whether a case is open, and that rule lives in
 * one place on the server.
 */
export type Conversation = {
  messages: OrderMessage[];
  canPost: boolean;
  role: SenderRole;
};
