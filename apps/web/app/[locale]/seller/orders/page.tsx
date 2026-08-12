import { getFormatter, getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { orderStatusColor } from "@/lib/orders/status";
import { getSellerOrders, requireSeller } from "@/lib/seller/queries";

export default async function SellerOrdersPage(props: PageProps<"/[locale]/seller/orders">) {
  const { locale } = await props.params;
  await requireSeller(locale);

  const [orders, t, tStatus, format] = await Promise.all([
    getSellerOrders(),
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
        <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">
          {awaiting > 0 ? t("awaiting", { count: awaiting }) : t("subheading")}
        </p>
        {disputed > 0 && (
          <p className="mt-1 text-sm text-danger">{t("disputedCount", { count: disputed })}</p>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-card border border-border p-8 text-center text-sm text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-card border border-border">
          {orders.map((order) => {
            const money = (cents: number) =>
              format.number(toMajorUnits(cents), currencyFormat(order.currency));
            const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <Link
                key={order.id}
                href={{ pathname: "/seller/orders/[id]", params: { id: order.id } }}
                className="flex items-center justify-between gap-4 p-4 no-underline hover:bg-surface"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {t("orderNumber", { number: order.sellerOrderNumber })}
                    <span className="ml-2 font-normal text-muted">{order.buyer.name}</span>
                  </p>
                  <p className="truncate text-sm text-muted">
                    {t("itemCount", { count: units })} ·{" "}
                    {format.dateTime(new Date(order.createdAt), { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-foreground">{money(order.totalCents)}</span>
                  <Chip color={orderStatusColor(order.status)}>
                    <Chip.Label>{tStatus(order.status)}</Chip.Label>
                  </Chip>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
