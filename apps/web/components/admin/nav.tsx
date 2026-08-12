"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { href: "/admin", key: "overview" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/categories", key: "categories" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("Admin.nav");

  return (
    <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto md:w-48 md:flex-col md:overflow-visible">
      {ITEMS.map((item) => {
        const isActive =
          item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

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
