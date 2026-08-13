import { getFormatter, getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { orderStatusColor } from "@/lib/orders/status";
import { getOrderStats, getSellerOrders, requireSeller } from "@/lib/seller/queries";
import { OrderStatCards } from "@/components/seller/order-stats";
import { OrderStatusTabs } from "@/components/seller/order-status-tabs";

export default async function SellerOrdersPage(props: PageProps<"/[locale]/seller/orders">) {
  const [{ locale }, searchParams] = await Promise.all([props.params, props.searchParams]);
  await requireSeller(locale);

  const raw = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const status = raw?.trim() || undefined;

  const [orders, stats, t, tStatus, format] = await Promise.all([
    getSellerOrders(status),
    getOrderStats(),
    getTranslations("SellerPanel.orders"),
    getTranslations("Order.status"),
    getFormatter(),
  ]);

  // Orders waiting on the seller come first as a count, because that is the
  // only number on this page anyone acts on.
  const awaiting = orders.filter((order) => order.actions.canAccept).length;
  /**
   * Shop-wide, from the API — not counted off the rows on screen.
   *
   * Counting the loaded page meant the warning vanished the moment you
   * filtered to any other status, which both under-reported it and made the
   * tabs jump as it appeared and disappeared. An open dispute is a fact about
   * the shop, not about the view you happen to be looking at.
   *
   * Worded differently from the awaiting count on purpose: there is nothing
   * for the seller to press yet on a dispute, so "needs your answer" would be
   * a lie.
   */
  const disputed = stats?.openProblems ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[26px]">
          {t("heading")}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {awaiting > 0 ? t("awaiting", { count: awaiting }) : t("subheading")}
        </p>
        {/* The mock's amber strip: a reported problem is something to look
            at, not an error the seller caused. */}
        {disputed > 0 && (
          // A link, because the only sensible response to reading it is to go
          // and look at them.
          <Link
            href={{ pathname: "/seller/orders", query: { status: "disputed" } }}
            className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-notice-border bg-notice px-3 py-1.5 text-[13px] text-notice-foreground no-underline hover:border-notice-foreground/40"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-notice-foreground" />
            {t("disputedCount", { count: disputed })}
          </Link>
        )}
      </div>

      {stats && <OrderStatCards stats={stats} />}

      {stats && <OrderStatusTabs counts={stats.statusCounts} active={status} />}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="md:overflow-x-auto md:rounded-2xl md:border md:border-border md:bg-surface">
          {/*
            A real table shape, scrolled horizontally rather than reflowed.
            Six columns of figures that line up down the page is the whole
            point of a table — collapsing them into stacked cards at narrow
            widths would lose the scanning it exists for. The mobile design
            has its own answer to this.
          */}
          <div className="flex flex-col gap-2.5 md:block md:min-w-[560px] md:gap-0">
            <div className="hidden grid-cols-[90px_minmax(140px,1.6fr)_100px_150px] items-center gap-x-2 border-b border-chrome-border bg-background px-4 py-2.5 text-xs font-semibold tracking-wider text-muted-soft uppercase md:grid">
              <div>{t("columnOrder")}</div>
              <div>{t("columnCustomer")}</div>
              <div className="text-right">{t("columnTotal")}</div>
              <div className="pl-3">{t("columnStatus")}</div>
            </div>

            {orders.map((order) => {
              const money = (cents: number) =>
                format.number(toMajorUnits(cents), currencyFormat(order.currency));
              const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const initials = (order.buyer.name ?? "?")
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0])
                .join("")
                .toUpperCase();

              return (
                <Link
                  key={order.id}
                  href={{ pathname: "/seller/orders/[id]", params: { id: order.id } }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 rounded-xl border border-border bg-surface p-3.5 text-[13.5px] no-underline hover:bg-row-hover md:grid-cols-[90px_minmax(140px,1.6fr)_100px_150px] md:gap-y-0 md:rounded-none md:border-x-0 md:border-t-0 md:p-0 md:px-4 md:py-3 md:last:border-b-0"
                >
                  {/* The reference is the link's subject, so it carries the
                      accent rather than the whole row turning terracotta. */}
                  <span className="col-start-1 row-start-1 font-bold text-accent md:col-start-1 md:row-start-1 md:font-semibold">
                    {t("orderNumber", { number: order.sellerOrderNumber })}
                  </span>
                  <span className="col-start-1 row-start-2 flex min-w-0 items-center gap-2.5 md:col-start-2 md:row-start-1">
                    <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-selected text-[10.5px] font-bold text-muted-strong">
                      {initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-foreground">{order.buyer.name}</span>
                      {/* Was two columns of its own. Folded under the name so
                          the table needs 560px rather than 820 and survives a
                          tablet without scrolling — and a long customer name
                          truncates instead of forcing the row wider. */}
                      <span className="block truncate text-xs text-muted-soft">
                        {t("itemCount", { count: units })} ·{" "}
                        {format.dateTime(new Date(order.createdAt), { dateStyle: "short" })}
                      </span>
                    </span>
                  </span>

                  <span className="col-start-2 row-start-2 text-right text-[15px] font-bold whitespace-nowrap text-foreground md:col-start-3 md:row-start-1 md:text-[13.5px] md:font-semibold">
                    {money(order.totalCents)}
                  </span>
                  <span className="col-start-2 row-start-1 justify-self-end md:col-start-4 md:row-start-1 md:justify-self-auto md:pl-3">
                    <Chip color={orderStatusColor(order.status)}>
                      <Chip.Label>{tStatus(order.status)}</Chip.Label>
                    </Chip>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 text-center text-[12.5px] text-muted-soft md:px-4 md:py-3 md:text-left">
            {t("showingCount", { count: orders.length })}
          </div>
        </div>
      )}
    </div>
  );
}
