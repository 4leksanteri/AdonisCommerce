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
        <h1 className="mt-1.5 text-[22px] font-bold tracking-tight text-foreground md:mt-0 md:text-2xl">
          {t("heading")}
        </h1>
        <p className="mt-1 text-[13px] text-muted md:text-sm">{t("subheading")}</p>
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
                /*
                 * A grid, so the same four elements can be placed differently
                 * at each width without rendering any of them twice. On a
                 * phone: shop beside the status, meta beside the total. On a
                 * desktop row: shop over meta on the left, with the total and
                 * the status each spanning both rows on the right.
                 */
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-xl border border-border bg-surface p-3.5 no-underline hover:bg-row-hover md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-x-5 md:gap-y-0.5 md:rounded-none md:border-0 md:p-4"
              >
                <p className="col-start-1 row-start-1 truncate text-sm font-semibold text-foreground">
                  {order.shop.name}
                </p>

                <p className="col-start-1 row-start-2 truncate text-xs text-muted-soft md:text-[12.5px] md:text-muted">
                  {t("itemCount", { count: units })} ·{" "}
                  {format.dateTime(new Date(order.createdAt), { dateStyle: "medium" })}
                </p>

                <span className="col-start-2 row-start-2 shrink-0 justify-self-end text-[14.5px] font-bold text-foreground md:row-span-2 md:row-start-1 md:self-center md:text-sm md:font-semibold">
                  {order.isRefunded ? money(order.refundedCents) : money(order.totalCents)}
                </span>

                <span className="col-start-2 row-start-1 shrink-0 justify-self-end md:col-start-3 md:row-span-2 md:self-center">
                  <Chip color={orderStatusColor(order.status)}>
                    <Chip.Label>{tStatus(order.status)}</Chip.Label>
                  </Chip>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
