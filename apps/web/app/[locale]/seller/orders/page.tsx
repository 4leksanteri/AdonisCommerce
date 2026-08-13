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
  // Counted separately and worded differently: there is nothing for the seller
  // to press yet on a dispute, so calling it "needs your answer" would be a lie.
  const disputed = orders.filter((order) =>
    order.disputes.some((dispute) => dispute.status === "open")
  ).length;

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
          <p className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-notice-border bg-notice px-3 py-1.5 text-[13px] text-notice-foreground">
            <span className="size-1.5 rounded-full bg-notice-foreground" />
            {t("disputedCount", { count: disputed })}
          </p>
        )}
      </div>

      {stats && <OrderStatCards stats={stats} />}

      {stats && <OrderStatusTabs counts={stats.statusCounts} active={status} />}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          {/*
            A real table shape, scrolled horizontally rather than reflowed.
            Six columns of figures that line up down the page is the whole
            point of a table — collapsing them into stacked cards at narrow
            widths would lose the scanning it exists for. The mobile design
            has its own answer to this.
          */}
          <div className="min-w-[820px]">
            <div className="grid grid-cols-[90px_minmax(160px,1.4fr)_100px_92px_120px_150px] items-center gap-x-2 border-b border-chrome-border bg-background px-4 py-2.5 text-xs font-semibold tracking-wider text-muted-soft uppercase">
              <div>{t("columnOrder")}</div>
              <div>{t("columnCustomer")}</div>
              <div className="text-right">{t("columnTotal")}</div>
              <div className="text-right">{t("columnItems")}</div>
              <div className="pl-6">{t("columnDate")}</div>
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
                  className="grid grid-cols-[90px_minmax(160px,1.4fr)_100px_92px_120px_150px] items-center gap-x-2 border-b border-border px-4 py-3 text-[13.5px] no-underline last:border-b-0 hover:bg-row-hover"
                >
                  {/* The reference is the link's subject, so it carries the
                      accent rather than the whole row turning terracotta. */}
                  <span className="font-semibold text-accent">
                    {t("orderNumber", { number: order.sellerOrderNumber })}
                  </span>

                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-selected text-[10.5px] font-bold text-muted-strong">
                      {initials}
                    </span>
                    <span className="truncate text-foreground">{order.buyer.name}</span>
                  </span>

                  <span className="text-right font-semibold text-foreground">
                    {money(order.totalCents)}
                  </span>
                  <span className="text-right text-muted">{t("itemCount", { count: units })}</span>
                  <span className="pl-6 text-muted">
                    {format.dateTime(new Date(order.createdAt), { dateStyle: "short" })}
                  </span>
                  <span className="pl-3">
                    <Chip color={orderStatusColor(order.status)}>
                      <Chip.Label>{tStatus(order.status)}</Chip.Label>
                    </Chip>
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="px-4 py-3 text-[12.5px] text-muted-soft">
            {t("showingCount", { count: orders.length })}
          </div>
        </div>
      )}
    </div>
  );
}
