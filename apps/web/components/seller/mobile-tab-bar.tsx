"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Four destinations, because a thumb reaching the bottom of a phone is worth
 * more than completeness. Everything the sidebar carries that doesn't fit
 * here lives behind "More" — see /seller/more.
 */
const TABS = [
  { href: "/seller/orders", key: "orders", d: "M4 6h16M4 12h16M4 18h16" },
  { href: "/seller/products", key: "products", d: "M4 5h16v14H4zM4 10h16" },
  {
    href: "/seller/shipping",
    key: "shipping",
    d: "M3 8h11v8H3zM14 11h4l3 3v2h-7zM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
  },
  { href: "/seller/more", key: "more", d: "M6 12h.01M12 12h.01M18 12h.01" },
] as const;

export function SellerMobileTabBar() {
  const pathname = usePathname();
  const t = useTranslations("SellerPanel.nav");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-chrome-border bg-chrome px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] md:hidden">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center gap-0.5 py-1.5 no-underline ${
              isActive ? "text-accent-soft-strong" : "text-muted-soft"
            }`}
          >
            <span
              className={`flex h-5.5 w-8.5 items-center justify-center rounded-full ${
                isActive ? "bg-accent-soft" : ""
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d={tab.d} />
              </svg>
            </span>
            <span className="text-[10.5px] font-semibold">{t(tab.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
