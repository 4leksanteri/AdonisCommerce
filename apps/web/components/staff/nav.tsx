"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Disputes are the first section, not the only one — the panel is shaped for
 * whatever comes next (payout problems, seller applications, moderation)
 * rather than being a single page pretending to be a tool.
 */
const ITEMS = [
  { href: "/staff", key: "overview" },
  { href: "/staff/disputes", key: "disputes" },
] as const;

export function StaffNav() {
  const pathname = usePathname();
  const t = useTranslations("Staff.nav");

  return (
    <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto md:w-48 md:flex-col md:overflow-visible">
      {ITEMS.map((item) => {
        // The overview is an exact match; everything else owns its subtree,
        // so a dispute detail still highlights "Disputes".
        const isActive =
          item.href === "/staff" ? pathname === item.href : pathname.startsWith(item.href);

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
          </Link>
        );
      })}
    </nav>
  );
}
