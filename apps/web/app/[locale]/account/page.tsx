import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/queries";
import { getMyOrders } from "@/lib/orders/queries";
import { getUnreadCounts } from "@/lib/messages/queries";
import { LogOutCard } from "@/components/account/log-out-card";

/**
 * The menu the phone navigates from.
 *
 * On mobile the side nav is hidden — a scrolling row of three links above
 * every page is a worse use of the width than a screen you drill down from
 * and back out of. On desktop the nav is right there, so this doubles as a
 * landing page rather than being a screen anyone has to pass through.
 */
export default async function AccountPage() {
  const [user, t, tNav] = await Promise.all([
    getCurrentUser(),
    getTranslations("Account.menu"),
    getTranslations("Account.nav"),
  ]);

  if (!user) return null;

  const [orders, unread] = await Promise.all([getMyOrders(), getUnreadCounts()]);

  const items = [
    {
      href: "/account/orders" as const,
      label: tNav("orders"),
      sub: t("ordersSub", { count: orders.length }),
    },
    {
      href: "/account/messages" as const,
      label: tNav("messages"),
      sub: unread.buyer > 0 ? t("messagesUnread", { count: unread.buyer }) : t("messagesRead"),
    },
    {
      href: "/account/settings" as const,
      label: tNav("settings"),
      sub: t("settingsSub"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-selected text-[15px] font-bold text-muted-strong">
          {user.initials}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">
            {user.fullName ?? user.email}
          </h1>
          <p className="truncate text-xs text-muted-soft">{user.email}</p>
        </div>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-3 p-4 no-underline hover:bg-row-hover"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{item.label}</span>
              <span className="mt-0.5 block text-xs text-muted-soft">{item.sub}</span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              className="shrink-0 text-border"
              aria-hidden
            >
              <polyline points="9,5 16,12 9,19" />
            </svg>
          </Link>
        ))}
      </div>

      <LogOutCard />
    </div>
  );
}
