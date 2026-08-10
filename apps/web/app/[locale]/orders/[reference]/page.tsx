import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Spinner } from "@heroui/react";
import { Container } from "@/components/ui/container";
import { BuyerOrderActions } from "@/components/storefront/order-actions";
import { OrderStatusPoller } from "@/components/storefront/order-status-poller";
import { Link } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { getOrder } from "@/lib/orders/queries";

export default async function OrderPage(props: PageProps<"/[locale]/orders/[reference]">) {
  const { reference } = await props.params;

  const [order, t, format] = await Promise.all([
    getOrder(reference),
    getTranslations("Order"),
    getFormatter(),
  ]);

  // Also covers "not signed in" and "someone else's order" — the API 404s
  // both, and a shopper has no business distinguishing them.
  if (!order) notFound();

  const money = (cents: number) =>
    format.number(toMajorUnits(cents), currencyFormat(order.currency));

  // Stripe's webhook, not the browser, is what marks an order paid — so for a
  // second or two after checkout this page is genuinely still waiting.
  const awaitingPayment = order.status === "pending_payment";
  const openDispute = order.disputes.find((dispute) => dispute.status === "open");

  return (
    <main className="flex-1 py-10">
      <Container className="flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {awaitingPayment ? t("confirmingHeading") : t("heading")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("subheading", { reference: order.reference, email: order.contactEmail })}
          </p>
        </div>

        {awaitingPayment && (
          <div className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm text-muted">
            <Spinner size="sm" />
            <span>{t("confirmingHint")}</span>
            <OrderStatusPoller />
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {order.shop.name}
            </p>
            <div className="flex items-center gap-3">
              {/* The seller's own numbering — what they'll quote back to you. */}
              <span className="text-xs text-muted">
                {t("sellerOrderNumber", { number: order.sellerOrderNumber })}
              </span>
              <span className="text-xs text-muted">
                {t(`status.${order.status}` as "status.pending")}
              </span>
            </div>
          </div>

          {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
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
              <span>{order.shippingCents === 0 ? t("shippingFree") : money(order.shippingCents)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 font-medium text-foreground">
              <span>{t("total")}</span>
              <span>{money(order.totalCents)}</span>
            </div>
          </div>

          {order.trackingNumber && (
            <p className="border-t border-border pt-3 text-sm text-muted">
              {t("trackingNumber", { number: order.trackingNumber })}
            </p>
          )}
        </div>

        <BuyerOrderActions order={order} />

        {openDispute && (
          <div className="rounded-lg border border-border p-4 text-sm">
            <p className="font-medium text-foreground">{t("problemOpen")}</p>
            <p className="mt-1 text-muted">{t(`problemReason.${openDispute.reason}`)}</p>
            {openDispute.detail && <p className="mt-1 text-muted">{openDispute.detail}</p>}
            {/* The seller isn't paid while this is open — worth saying, so the
                buyer knows the platform still has leverage on their behalf. */}
            <p className="mt-2 text-muted">{t("problemHeld")}</p>
          </div>
        )}

        {order.isRefunded && (
          <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
            <p>{t("refundedNotice", { amount: money(order.refundedCents) })}</p>
            {order.cancelReason && (
              <p className="mt-1">{t("cancelReason", { reason: order.cancelReason })}</p>
            )}
          </div>
        )}

        <div className="rounded-lg border border-border p-4 text-sm">
          <p className="font-medium text-foreground">{t("shippingTo")}</p>
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
        </div>

        <Link href="/" className="text-sm text-muted no-underline hover:text-foreground">
          {t("continueShopping")}
        </Link>
      </Container>
    </main>
  );
}
