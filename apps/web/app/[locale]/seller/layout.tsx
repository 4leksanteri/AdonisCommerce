import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SellerNav } from "@/components/seller/nav";
import { getUnreadCounts } from "@/lib/messages/queries";
import { getCurrentUser } from "@/lib/auth/queries";
import { getDisplayCurrency } from "@/lib/storefront/currency";

const APP_NAME = process.env.APP_NAME ?? "Ecommerce";

/**
 * An application shell, not a page inside the shop.
 *
 * The storefront's header and footer are suppressed here (see `ChromeGate`)
 * because a seller working through orders is not shopping — they want a
 * persistent sidebar and the full height of the window, and stacking a shop
 * header above it would be two navigations arguing about which one you are
 * using.
 */
export default async function SellerLayout({ children }: LayoutProps<"/[locale]/seller">) {
  const [unread, user, currency, t] = await Promise.all([
    getUnreadCounts(),
    getCurrentUser(),
    getDisplayCurrency(),
    getTranslations("SellerPanel"),
  ]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-5 border-b border-field-border bg-sidebar p-3.5 md:min-h-screen md:w-58 md:border-r md:border-b-0 md:p-5">
        <Link href="/seller" className="flex items-center gap-2.5 px-2 no-underline">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
            {APP_NAME.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-foreground">
              {APP_NAME}
            </span>
            <span className="block text-[11px] text-muted-soft">{t("title")}</span>
          </span>
        </Link>

        <SellerNav unreadMessages={unread.seller} />

        {/* Pushed to the bottom on desktop: it is the way out, not a
            destination competing with the panel's own sections. */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-strong no-underline hover:bg-sidebar-hover hover:text-foreground md:mt-auto"
        >
          <svg
            width="13"
            height="13"
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
          <div className="hidden items-center gap-2.5 rounded-xl border border-field-border bg-surface p-2.5 md:flex">
            <span className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-selected text-xs font-bold text-muted-strong">
              {user.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-foreground">
                {user.fullName ?? user.email}
              </span>
              <span className="block text-[11px] text-muted-soft">
                {currency ?? "EUR"} · {user.seller?.shopName ?? ""}
              </span>
            </span>
          </div>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-chrome-border bg-chrome px-5 py-3.5 md:px-7">
          <p className="text-[13px] text-muted-soft">{t("title")}</p>
        </div>
        <div className="flex flex-1 flex-col gap-5 px-5 py-6 pb-10 md:gap-[22px] md:px-7 md:pt-[26px]">
          {children}
        </div>
      </main>
    </div>
  );
}
