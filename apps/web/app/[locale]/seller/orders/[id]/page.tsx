import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { OrderActions } from "@/components/seller/order-actions";
import { OrderConversation } from "@/components/conversations/order-conversation";
import { getConversation } from "@/lib/conversations/queries";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { orderStatusColor } from "@/lib/orders/status";
import { getSellerOrder, requireSeller } from "@/lib/seller/queries";

export default async function SellerOrderPage(props: PageProps<"/[locale]/seller/orders/[id]">) {
  const { locale, id } = await props.params;
  await requireSeller(locale);

  const [order, t, tStatus, format] = await Promise.all([
    getSellerOrder(id),
    getTranslations("SellerPanel.orders"),
    getTranslations("Order.status"),
    getFormatter(),
  ]);

  // Covers another shop's order too — the API scopes the lookup, so it 404s
  // rather than telling one seller that another's order exists.
  if (!order) notFound();

  const conversation = await getConversation(order.id);

  const money = (cents: number) =>
    format.number(toMajorUnits(cents), currencyFormat(order.currency));
  const when = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" });
  const openDispute = order.disputes.find((dispute) => dispute.status === "open");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/seller/orders"
            className="text-sm text-muted no-underline hover:text-foreground"
          >
            {t("backToOrders")}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-foreground">
            {t("orderNumber", { number: order.sellerOrderNumber })}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("placedOn", { date: when(order.createdAt) })} · {order.reference}
          </p>
        </div>
        <Chip color={orderStatusColor(order.status)}>
          <Chip.Label>{tStatus(order.status)}</Chip.Label>
        </Chip>
      </div>

      <OrderActions order={order} />

      {conversation && <OrderConversation orderId={order.id} conversation={conversation} />}

      {openDispute && (
        <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          <p className="font-medium">{t(`disputeReason.${openDispute.reason}`)}</p>
          {openDispute.detail && <p className="mt-1">{openDispute.detail}</p>}
          <p className="mt-2">{t("disputeHeld")}</p>
        </div>
      )}

      {order.isRefunded && (
        <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          <p>{t("refunded", { amount: money(order.refundedCents) })}</p>
          {order.cancelReason && <p className="mt-1">{t("reasonGiven", { reason: order.cancelReason })}</p>}
          {/* The buyer has their money back but the shop's share couldn't be
              taken back — the platform is carrying it until someone chases. */}
          {!order.transferReversed && <p className="mt-1">{t("payoutNotReclaimed")}</p>}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-4 rounded-card border border-border p-4">
          <h2 className="font-medium text-foreground">{t("itemsHeading")}</h2>

          {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-card border border-border bg-surface">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.productTitle}</p>
                {item.variantLabel && (
                  <p className="truncate text-xs text-muted">{item.variantLabel}</p>
                )}
                <p className="text-xs text-muted">
                  {t("quantityTimes", { quantity: item.quantity, price: money(item.unitPriceCents) })}
                </p>
              </div>
              <span className="shrink-0 text-sm text-foreground">
                {money(item.unitPriceCents * item.quantity)}
              </span>
            </div>
          ))}

          <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>{t("subtotal")}</span>
              <span>{money(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{t("shipping")}</span>
              <span>{money(order.shippingCents)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 text-foreground">
              <span>{t("buyerPaid")}</span>
              <span>{money(order.totalCents)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{t("commission")}</span>
              <span>−{money(order.platformFeeCents)}</span>
            </div>
            {/* The number the seller actually cares about, so it's the one in
                bold rather than the total the buyer paid. */}
            <div className="flex justify-between border-t border-border pt-1 font-medium text-foreground">
              <span>{t("yourPayout")}</span>
              <span>{money(order.payoutCents)}</span>
            </div>
          </div>

          {/* The money is held until the order closes, so "when do I get paid"
              is answered right next to the amount rather than left to guess. */}
          <p className="border-t border-border pt-3 text-xs text-muted">
            {order.isPaidOut
              ? t("payoutSent")
              : openDispute
                ? t("payoutOnHold")
                : order.payoutReleaseAt
                  ? t("payoutDue", { date: when(order.payoutReleaseAt) })
                  : t("payoutAfterDelivery")}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-border p-4 text-sm">
            <p className="font-medium text-foreground">{t("shipTo")}</p>
            <address className="mt-1 not-italic text-muted">
              {order.shipping.name}
              <br />
              {order.shipping.line1}
              {order.shipping.line2 && (
                <>
                  <br />
                  {order.shipping.line2}
                </>
              )}
              <br />
              {order.shipping.postalCode} {order.shipping.city}
              <br />
              {order.shipping.country}
            </address>
            <p className="mt-3 text-muted">{order.buyer.email}</p>
          </div>

          <div className="rounded-card border border-border p-4 text-sm">
            <p className="font-medium text-foreground">{t("timelineHeading")}</p>
            <ul className="mt-2 flex flex-col gap-1 text-muted">
              <li>{t("timelinePlaced", { date: when(order.createdAt) })}</li>
              {order.acceptedAt && <li>{t("timelineAccepted", { date: when(order.acceptedAt) })}</li>}
              {order.shippedAt && <li>{t("timelineShipped", { date: when(order.shippedAt) })}</li>}
              {order.cancelledAt && (
                <li>{t("timelineCancelled", { date: when(order.cancelledAt) })}</li>
              )}
            </ul>
            {order.trackingNumber && (
              <p className="mt-3 text-muted">
                {t("tracking", { number: order.trackingNumber })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
