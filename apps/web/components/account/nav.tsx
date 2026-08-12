"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { href: "/account/orders", key: "orders" },
  { href: "/account/messages", key: "messages" },
  { href: "/account/settings", key: "settings" },
] as const;

/** `unreadMessages` badges the Messages item; 0 shows nothing. */
export function AccountNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  const t = useTranslations("Account.nav");

  return (
    <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto md:w-48 md:flex-col md:overflow-visible">
      {ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-card px-3 py-2 text-sm font-medium whitespace-nowrap no-underline ${
              isActive ? "bg-surface text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {t(item.key)}
            {item.key === "messages" && unreadMessages > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 py-0.5 text-xs text-background">
                {unreadMessages}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
