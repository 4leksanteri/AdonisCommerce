"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { href: "/seller", key: "dashboard" },
  { href: "/seller/orders", key: "orders" },
  { href: "/seller/messages", key: "messages" },
  { href: "/seller/products", key: "products" },
  { href: "/seller/shipping", key: "shipping" },
  { href: "/seller/payouts", key: "payouts" },
  { href: "/seller/settings", key: "settings" },
] as const;

export function SellerNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  const t = useTranslations("SellerPanel.nav");

  return (
    <nav className="flex flex-row gap-0.5 overflow-x-auto md:flex-col md:overflow-visible">
      {ITEMS.map((item) => {
        const isActive =
          item.href === "/seller" ? pathname === item.href : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm whitespace-nowrap no-underline ${
              isActive
                ? "bg-sidebar-selected font-semibold text-foreground"
                : "font-medium text-muted-strong hover:bg-sidebar-hover hover:text-foreground"
            }`}
          >
            {t(item.key)}
            {item.key === "messages" && unreadMessages > 0 && (
              <span className="rounded-full bg-accent-soft px-1.5 text-[11px] font-semibold text-accent-soft-strong">
                {unreadMessages}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
