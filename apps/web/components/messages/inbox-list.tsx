import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ShopAvatar } from "@/components/storefront/shop-avatar";
import type { ConversationSummary, DirectRole } from "@/lib/messages/types";

/**
 * One inbox component for both sides. Which end you are on changes who the
 * rows are named after and where they link — the shape of "a list of
 * conversations, newest first, unread ones marked" is the same either way.
 */
export async function InboxList({
  conversations,
  role,
}: {
  conversations: ConversationSummary[];
  role: DirectRole;
}) {
  const [t, format] = await Promise.all([getTranslations("Messages"), getFormatter()]);

  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-sm text-muted">
        {role === "seller" ? t("emptySeller") : t("emptyBuyer")}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {conversations.map((conversation) => {
        // An anonymised account leaves the thread standing but takes the name
        // with it, which is the policy working rather than data missing.
        const name = conversation.with.name ?? t("unknownParty");

        return (
          <Link
            key={conversation.id}
            href={{
              pathname: role === "seller" ? "/seller/messages/[id]" : "/account/messages/[id]",
              params: { id: conversation.id },
            }}
            className="flex items-center gap-3 p-4 no-underline hover:bg-surface"
          >
            {/* The same monogram-or-picture used everywhere else. A
                shopper has no avatar, so their side is always initials. */}
            <ShopAvatar name={name} url={conversation.with.avatarUrl} size="sm" />

            <div className="min-w-0 flex-1">
              <p
                className={`truncate ${
                  conversation.isUnread ? "font-semibold text-foreground" : "text-foreground"
                }`}
              >
                {name}
              </p>
              <p className="truncate text-sm text-muted">
                {/* Whose turn it is, said in one word rather than a badge. */}
                {conversation.lastSenderRole === role && `${t("you")}: `}
                {conversation.excerpt}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              {conversation.lastMessageAt && (
                <span className="text-xs text-muted">
                  {format.dateTime(new Date(conversation.lastMessageAt), { dateStyle: "medium" })}
                </span>
              )}
              {conversation.isUnread && (
                <span
                  aria-label={t("unread")}
                  className="size-2 rounded-full bg-foreground"
                  role="status"
                />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
