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
    <nav className="hidden shrink-0 gap-0.5 md:sticky md:top-6 md:flex md:w-44 md:flex-col">
      {/* Names the column, so the panel reads as a place rather than three
          loose links. Hidden on mobile, where the nav is a scrolling row. */}
      <p className="px-2.5 pb-2 text-xs font-semibold tracking-wider text-muted-soft uppercase">
        {t("sectionLabel")}
      </p>
      {ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg px-2.5 py-2 text-sm whitespace-nowrap no-underline ${
              isActive
                ? "bg-selected font-semibold text-foreground"
                : "font-medium text-muted-strong hover:bg-selected"
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
