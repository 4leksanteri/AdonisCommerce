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

  const [order, t, tStatus, tTimeline, format] = await Promise.all([
    getSellerOrder(id),
    getTranslations("SellerPanel.orders"),
    getTranslations("Order.status"),
    getTranslations("SellerPanel.orders.timelineLabel"),
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

  const events = [
    { label: tTimeline("placed"), at: when(order.createdAt) },
    order.acceptedAt && { label: tTimeline("accepted"), at: when(order.acceptedAt) },
    order.shippedAt && { label: tTimeline("shipped"), at: when(order.shippedAt) },
    order.cancelledAt && { label: tTimeline("cancelled"), at: when(order.cancelledAt) },
  ].filter((entry): entry is { label: string; at: string } => Boolean(entry));

  const buyerInitials = (order.buyer.name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/seller/orders"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent no-underline hover:underline"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              aria-hidden
            >
              <polyline points="15,5 8,12 15,19" />
            </svg>
            {t("backToOrders")}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-foreground">
            {t("orderNumber", { number: order.sellerOrderNumber })}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {t("placedOn", { date: when(order.createdAt) })} · {order.reference}
          </p>
        </div>
        <Chip color={orderStatusColor(order.status)}>
          <Chip.Label>{tStatus(order.status)}</Chip.Label>
        </Chip>
      </div>

      <OrderActions order={order} />

      {openDispute && (
        <div className="rounded-xl border border-notice-border bg-notice p-3.5 text-[12.5px] leading-relaxed text-notice-foreground md:rounded-2xl">
          {/* The reason leads, in bold — it is the seller's first question.
              What the buyer wrote sits under it, and the consequence for the
              payout last, because that is context rather than news. */}
          <p className="font-bold">{t(`disputeReason.${openDispute.reason}`)}</p>
          {openDispute.detail && <p className="mt-1">{openDispute.detail}</p>}
          <p className="mt-2">{t("disputeHeld")}</p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] md:items-start md:gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-3.5 md:rounded-2xl md:p-5">
            <h2 className="font-medium text-foreground">{t("itemsHeading")}</h2>

            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-selected">
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
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.productTitle}
                  </p>
                  {item.variantLabel && (
                    <p className="truncate text-xs text-muted">{item.variantLabel}</p>
                  )}
                  <p className="text-xs text-muted">
                    {t("quantityTimes", {
                      quantity: item.quantity,
                      price: money(item.unitPriceCents),
                    })}
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
            </div>

            {/*
              The seller's own number, in a panel of its own rather than one
              more line under a rule. It is the figure they came to the page
              for, and "when do I get paid" belongs inside it with the amount
              rather than as a footnote below the card.
            */}
            <div className="flex flex-col gap-1 rounded-[10px] border border-chrome-border bg-background px-3.5 py-3">
              <div className="flex justify-between text-[14.5px] font-bold text-foreground">
                <span>{t("yourPayout")}</span>
                <span>{money(order.payoutCents)}</span>
              </div>
              <p className="text-xs text-muted-soft">
                {order.isPaidOut
                  ? t("payoutSent")
                  : openDispute
                    ? t("payoutOnHold")
                    : order.payoutReleaseAt
                      ? t("payoutDue", { date: when(order.payoutReleaseAt) })
                      : t("payoutAfterDelivery")}
              </p>
            </div>
          </div>

          {order.isRefunded && (
            <div className="rounded-xl border border-notice-border bg-notice p-3.5 text-[12.5px] leading-relaxed text-notice-foreground md:rounded-2xl">
              <p>{t("refunded", { amount: money(order.refundedCents) })}</p>
              {order.cancelReason && (
                <p className="mt-1">{t("reasonGiven", { reason: order.cancelReason })}</p>
              )}
              {/* The buyer has their money back but the shop's share couldn't be
                taken back — the platform is carrying it until someone chases. */}
              {!order.transferReversed && <p className="mt-1">{t("payoutNotReclaimed")}</p>}
            </div>
          )}

          {/* Messages sit at the foot of the main column, under the money
              they are usually about, rather than under the whole grid. */}
          {conversation && <OrderConversation orderId={order.id} conversation={conversation} />}
        </div>
        <div className="flex flex-col gap-4">
          {/*
            The buyer, led by who they are rather than by where the parcel
            goes. A seller reading this wants to know who they are dealing
            with first; the address is the detail underneath, which is why it
            gets its own label rather than being the card's title.
          */}
          <div className="rounded-xl border border-border bg-surface p-3.5 text-sm md:rounded-2xl md:p-5">
            <p className="font-semibold text-foreground">{t("buyerHeading")}</p>

            <div className="mt-3 flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-selected text-[11px] font-bold text-muted-strong">
                {buyerInitials}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">
                  {order.buyer.name}
                </span>
                <span className="block truncate text-[12.5px] text-muted-soft">
                  {order.buyer.email}
                </span>
              </span>
            </div>

            <p className="mt-4 border-t border-border pt-3.5 text-[11.5px] font-semibold tracking-wider text-muted-soft uppercase">
              {t("shipTo")}
            </p>
            <address className="mt-1.5 not-italic text-muted">
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
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5 text-sm md:rounded-2xl md:p-5">
            <p className="font-semibold text-foreground">{t("timelineHeading")}</p>
            {/* Dots on a connecting line rather than a bullet list — the
                point of a timeline is that the entries are one sequence, and
                the last one is where the order currently stands. */}
            <ol className="mt-3 flex flex-col">
              {events.map((event, index) => {
                const isLast = index === events.length - 1;

                return (
                  <li key={event.label} className="relative flex gap-3 pb-4 last:pb-0">
                    {!isLast && (
                      <span className="absolute top-2 left-[2.5px] h-full w-px bg-border" />
                    )}
                    <span
                      className={`relative mt-1.5 size-1.5 shrink-0 rounded-full ${
                        isLast ? "bg-accent" : "bg-border"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{event.label}</span>
                      <span className="block text-xs text-muted-soft">{event.at}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            {order.trackingNumber && (
              <p className="mt-3 text-muted">{t("tracking", { number: order.trackingNumber })}</p>
            )}
          </div>
        </div>
      </div>

      {/*
        Order from the spec: items and payout, the refund notice, the buyer,
        what happened, then the conversation. Messages come last because the
        thread is the only block with no ceiling on its height — anything
        below it gets pushed off screen as soon as people start talking.
      */}
    </div>
  );
}
