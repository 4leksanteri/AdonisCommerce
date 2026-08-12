import { getFormatter, getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/queries";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { getMyOrders } from "@/lib/orders/queries";
import { orderStatusColor } from "@/lib/orders/status";

export default async function OrdersPage() {
  const [user, t, tStatus, format] = await Promise.all([
    getCurrentUser(),
    getTranslations("Orders"),
    getTranslations("Order.status"),
    getFormatter(),
  ]);

  // Signed out, the layout is already showing the sign-in prompt in place of
  // this, so there is nothing to render and nothing worth asking the API for.
  if (!user) return null;

  const orders = await getMyOrders();

  return (
    <div className="flex max-w-reading flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-border p-8 text-center text-sm text-muted">
          <p>{t("empty")}</p>
          <Link href="/" className="text-foreground">
            {t("startShopping")}
          </Link>
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
                href={{
                  pathname: "/account/orders/[reference]",
                  params: { reference: order.reference },
                }}
                className="flex items-center justify-between gap-4 p-4 no-underline hover:bg-surface"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{order.shop.name}</p>
                  <p className="truncate text-sm text-muted">
                    {t("itemCount", { count: units })} ·{" "}
                    {format.dateTime(new Date(order.createdAt), { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-foreground">
                    {order.isRefunded ? money(order.refundedCents) : money(order.totalCents)}
                  </span>
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
