import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { DisputeActions } from "@/components/staff/dispute-actions";
import { OrderConversation } from "@/components/conversations/order-conversation";
import { getConversation } from "@/lib/conversations/queries";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { getDispute, requireStaff } from "@/lib/staff/queries";

export default async function StaffDisputePage(
  props: PageProps<"/[locale]/staff/disputes/[id]">
) {
  const { locale, id } = await props.params;
  await requireStaff(locale);

  const [dispute, t, tReason, format] = await Promise.all([
    getDispute(id),
    getTranslations("Staff"),
    getTranslations("Order.problemReason"),
    getFormatter(),
  ]);

  if (!dispute) notFound();

  const conversation = await getConversation(dispute.order.id);

  const { order } = dispute;
  const money = (cents: number) =>
    format.number(toMajorUnits(cents), currencyFormat(order.currency));
  const when = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
        <div>
          <Link href="/staff/disputes" className="text-sm text-muted no-underline hover:text-foreground">
            {t("backToQueue")}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{tReason(dispute.reason)}</h1>
          <p className="mt-1 text-sm text-muted">
            {t("openedOn", { date: when(dispute.createdAt) })}
          </p>
        </div>

        {dispute.status !== "open" && (
          <div className="rounded-card border border-border p-4 text-sm">
            <p className="font-medium text-foreground">{t(`outcome.${dispute.status}`)}</p>
            {dispute.resolvedAt && (
              <p className="mt-1 text-muted">{t("settledOn", { date: when(dispute.resolvedAt) })}</p>
            )}
            {dispute.resolutionNote && <p className="mt-1 text-muted">{dispute.resolutionNote}</p>}
          </div>
        )}

        <div className="rounded-card border border-border p-4">
          <p className="text-sm font-medium text-foreground">{t("buyerSaid")}</p>
          <p className="mt-1 text-sm whitespace-pre-line text-muted">
            {dispute.detail || t("noDetail")}
          </p>
        </div>

        <DisputeActions dispute={dispute} />

        {conversation && (
          <OrderConversation orderId={dispute.order.id} conversation={conversation} />
        )}

        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          <div className="flex flex-col gap-3 rounded-card border border-border p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">
                {t("orderNumber", { number: order.sellerOrderNumber })}
              </p>
              <Chip color={order.isPaidOut ? "danger" : undefined}>
                <Chip.Label>{order.isPaidOut ? t("paidOut") : t("held")}</Chip.Label>
              </Chip>
            </div>

            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-muted">
                <span className="truncate">
                  {item.quantity} × {item.productTitle}
                  {item.variantLabel && ` (${item.variantLabel})`}
                </span>
                <span className="shrink-0">{money(item.unitPriceCents * item.quantity)}</span>
              </div>
            ))}

            <div className="flex justify-between border-t border-border pt-2 font-medium text-foreground">
              <span>{t("orderTotal")}</span>
              <span>{money(order.totalCents)}</span>
            </div>

            {order.refundedCents > 0 && (
              <div className="flex justify-between text-muted">
                <span>{t("alreadyRefunded")}</span>
                <span>{money(order.refundedCents)}</span>
              </div>
            )}

            <p className="text-xs text-muted">{order.reference}</p>
          </div>

          <div className="flex flex-col gap-3 rounded-card border border-border p-4 text-sm">
            {/* Both sides' contact details in one place — settling a dispute
                usually means talking to someone. */}
            <div>
              <p className="font-medium text-foreground">{t("buyer")}</p>
              <p className="text-muted">{order.buyerName}</p>
              <p className="text-muted">{order.buyerEmail}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">{t("shop")}</p>
              <p className="text-muted">{order.shopName}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">{t("dispatch")}</p>
              <p className="text-muted">
                {order.shippedAt ? when(order.shippedAt) : t("notShipped")}
              </p>
              {order.trackingNumber && <p className="text-muted">{order.trackingNumber}</p>}
            </div>
          </div>
        </div>
    </div>
  );
}
