import { getFormatter, getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { AccountBackLink } from "@/components/account/back-link";
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
    <div className="flex flex-col gap-6">
      <div>
        {/* Inside the heading block, not a sibling in the gap-6 stack — a
            back link belongs to the title it returns from, and 24px of air
            reads as two unrelated things. */}
        <AccountBackLink />
        <h1 className="mt-1.5 text-xl font-semibold text-foreground md:mt-0">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
          <p>{t("empty")}</p>
          <Link href="/" className="font-medium text-accent">
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 md:gap-0 md:divide-y md:divide-border md:overflow-hidden md:rounded-2xl md:border md:border-border md:bg-surface">
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
                className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3.5 no-underline hover:bg-row-hover md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-none md:border-0 md:p-4"
              >
                <div className="flex items-center justify-between gap-3 md:min-w-0 md:flex-col md:items-start md:gap-0">
                  <p className="font-medium text-foreground">{order.shop.name}</p>
                  {/* Beside the shop on a phone, over on the right on a
                      desktop row — same chip, different place in the flow. */}
                  <span className="shrink-0 md:hidden">
                    <Chip color={orderStatusColor(order.status)}>
                      <Chip.Label>{tStatus(order.status)}</Chip.Label>
                    </Chip>
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 md:shrink-0 md:items-center">
                  <p className="truncate text-sm text-muted">
                    {t("itemCount", { count: units })} ·{" "}
                    {format.dateTime(new Date(order.createdAt), { dateStyle: "medium" })}
                  </p>
                  <span className="shrink-0 font-semibold text-foreground md:text-sm md:font-normal">
                    {order.isRefunded ? money(order.refundedCents) : money(order.totalCents)}
                  </span>
                  <span className="hidden md:inline-flex">
                    <Chip color={orderStatusColor(order.status)}>
                      <Chip.Label>{tStatus(order.status)}</Chip.Label>
                    </Chip>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
