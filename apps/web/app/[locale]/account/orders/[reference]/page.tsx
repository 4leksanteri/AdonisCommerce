import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Spinner } from "@heroui/react";
import { BuyerOrderActions } from "@/components/storefront/order-actions";
import { ReviewForm } from "@/components/storefront/review-form";
import { OrderConversation } from "@/components/conversations/order-conversation";
import { getConversation } from "@/lib/conversations/queries";
import { OrderStatusPoller } from "@/components/storefront/order-status-poller";
import { Link } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { getOrder } from "@/lib/orders/queries";
import { getCurrentUser } from "@/lib/auth/queries";

export default async function OrderPage(props: PageProps<"/[locale]/account/orders/[reference]">) {
  const { reference } = await props.params;

  // Signed out, the layout shows the sign-in prompt instead of this page.
  // Checked before the fetch so an unauthenticated visitor following an order
  // link out of their inbox gets asked to sign in, not a bare 404.
  if (!(await getCurrentUser())) return null;

  const [order, t, tReviews, format] = await Promise.all([
    getOrder(reference),
    getTranslations("Order"),
    getTranslations("Reviews"),
    getFormatter(),
  ]);

  // Someone else's order 404s: the API scopes every lookup to the signed-in
  // buyer, and which references exist is not a shopper's business.
  if (!order) notFound();

  const conversation = await getConversation(order.id);

  const money = (cents: number) =>
    format.number(toMajorUnits(cents), currencyFormat(order.currency));

  // Stripe's webhook, not the browser, is what marks an order paid — so for a
  // second or two after checkout this page is genuinely still waiting.
  const awaitingPayment = order.status === "pending_payment";
  const openDispute = order.disputes.find((dispute) => dispute.status === "open");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {awaitingPayment ? t("confirmingHeading") : t("heading")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t("subheading", { reference: order.reference, email: order.contactEmail })}
        </p>
      </div>

      {awaitingPayment && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          <Spinner size="sm" />
          <span>{t("confirmingHint")}</span>
          <OrderStatusPoller />
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          {/* Reads the order's snapshot of the name, but links by slug,
              which a rename leaves alone. */}
          <Link
            href={{ pathname: "/shop/[shopSlug]", params: { shopSlug: order.shop.slug } }}
            className="text-xs font-medium tracking-wide text-muted uppercase no-underline hover:text-foreground"
          >
            {order.shop.name}
          </Link>
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
            <span>
              {order.shippingCents === 0 ? t("shippingFree") : money(order.shippingCents)}
            </span>
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

      {conversation && <OrderConversation orderId={order.id} conversation={conversation} />}

      {/* Only once the order has closed out — the point of a review is an
          opinion of the thing in your hands, and the API refuses earlier. */}
      {order.status === "completed" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-medium text-foreground">{tReviews("orderHeading")}</h2>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 border-b border-border pb-4 last:border-b-0 last:pb-0"
            >
              <p className="text-sm font-medium text-foreground">{item.productTitle}</p>
              <ReviewForm
                orderItemId={item.id}
                productTitle={item.productTitle}
                existing={item.review ?? null}
              />
            </div>
          ))}
        </div>
      )}

      {openDispute && (
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
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

      <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
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

      <Link href="/" className="text-sm font-medium text-accent no-underline hover:underline">
        {t("continueShopping")}
      </Link>
    </div>
  );
}
