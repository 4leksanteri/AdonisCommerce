import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSeller } from "@/lib/seller/queries";
import { getCurrentUser } from "@/lib/auth/queries";
import { getDisplayCurrency } from "@/lib/storefront/currency";

/**
 * What the bottom bar couldn't hold.
 *
 * Only reachable on a phone — on desktop every one of these is a sidebar
 * item, so the page redirects nowhere and simply isn't linked. It exists
 * because four tabs is the most a thumb should have to choose between.
 */
export default async function SellerMorePage(props: PageProps<"/[locale]/seller/more">) {
  const { locale } = await props.params;
  await requireSeller(locale);

  const [user, currency, t, tNav] = await Promise.all([
    getCurrentUser(),
    getDisplayCurrency(),
    getTranslations("SellerPanel"),
    getTranslations("SellerPanel.nav"),
  ]);

  const items = [
    { href: "/seller" as const, label: tNav("dashboard") },
    { href: "/seller/messages" as const, label: tNav("messages") },
    { href: "/seller/payouts" as const, label: tNav("payouts") },
    { href: "/seller/settings" as const, label: tNav("settings") },
  ];

  return (
    <div className="flex flex-col gap-4 md:hidden">
      <h1 className="text-[22px] font-bold tracking-tight text-foreground">{tNav("more")}</h1>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-3 p-4 text-sm font-medium text-foreground no-underline hover:bg-row-hover"
          >
            {item.label}
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

      <Link
        href="/"
        className="flex items-center gap-2 px-0.5 py-1 text-sm font-medium text-accent no-underline"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="11,6 5,12 11,18" />
        </svg>
        {t("backToShop")}
      </Link>

      {user && (
        <div className="flex items-center gap-2.5 rounded-xl border border-field-border bg-surface p-3">
          <span className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-selected text-xs font-bold text-muted-strong">
            {user.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold text-foreground">
              {user.fullName ?? user.email}
            </span>
            <span className="block text-[11.5px] text-muted-soft">
              {currency ?? "EUR"} · {user.seller?.shopName ?? ""}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
