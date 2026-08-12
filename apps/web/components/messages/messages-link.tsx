"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Comment } from "@gravity-ui/icons";
import { Badge } from "@heroui/react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/context";
import { unreadCountsAction } from "@/lib/messages/actions";

/**
 * The inbox, from anywhere on the site.
 *
 * Refetched on every navigation rather than seeded once, because a badge
 * that only ever counts up is worse than none — read a thread and it has to
 * clear. One small request per page change is the price of it telling the
 * truth.
 */
export function MessagesLink() {
  const t = useTranslations("Messages");
  const { user } = useAuth();
  const pathname = usePathname();
  const [counts, setCounts] = useState({ buyer: 0, seller: 0 });

  useEffect(() => {
    // No reset for the signed-out case: the component renders nothing at all
    // without a user, so a stale count has nowhere to appear, and clearing it
    // here would be setting state in an effect for no visible reason.
    if (!user) return;

    let cancelled = false;
    unreadCountsAction().then((next) => {
      if (!cancelled) setCounts(next);
    });

    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  // Messaging needs an account, so signed out there is nothing to link to.
  if (!user) return null;

  const total = counts.buyer + counts.seller;

  /**
   * Whichever inbox has something waiting. A seller browsing the storefront
   * gets sent to their shop's inbox, which is where the message they are
   * being told about actually is — a badge that lands you on an empty page
   * is a badge that lied.
   */
  const href = counts.seller > 0 ? "/seller/messages" : "/account/messages";

  return (
    <Link
      href={href}
      aria-label={total > 0 ? t("unreadCount", { count: total }) : t("heading")}
      className="flex size-10 items-center justify-center rounded-full text-foreground no-underline hover:bg-surface"
    >
      <Badge.Anchor className="flex size-6 items-center justify-center">
        <Comment className="size-6" />
        {total > 0 && (
          <Badge color="danger" size="sm">
            {total}
          </Badge>
        )}
      </Badge.Anchor>
    </Link>
  );
}
