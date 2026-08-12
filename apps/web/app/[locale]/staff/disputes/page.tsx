import { getFormatter, getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { getDisputes, requireStaff } from "@/lib/staff/queries";

export default async function StaffDisputesPage(props: PageProps<"/[locale]/staff/disputes">) {
  const { locale } = await props.params;
  await requireStaff(locale);

  const [disputes, t, tReason, format] = await Promise.all([
    getDisputes("open"),
    getTranslations("Staff"),
    getTranslations("Order.problemReason"),
    getFormatter(),
  ]);

  return (
    <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
          <p className="mt-1 text-sm text-muted">
            {disputes.length === 0 ? t("allClear") : t("waiting", { count: disputes.length })}
          </p>
        </div>

        {disputes.length === 0 ? (
          <div className="rounded-card border border-border p-8 text-center text-sm text-muted">
            {t("empty")}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-card border border-border">
            {disputes.map((dispute) => (
              <Link
                key={dispute.id}
                href={{ pathname: "/staff/disputes/[id]", params: { id: dispute.id } }}
                className="flex items-start justify-between gap-4 p-4 no-underline hover:bg-surface"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{tReason(dispute.reason)}</p>
                  <p className="truncate text-sm text-muted">
                    {dispute.order.shopName} · {dispute.order.reference} ·{" "}
                    {format.dateTime(new Date(dispute.createdAt), { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-foreground">
                    {format.number(
                      toMajorUnits(dispute.order.totalCents),
                      currencyFormat(dispute.order.currency)
                    )}
                  </span>
                  {/* Whether the money is still ours decides how easy this is
                      to settle, so it belongs in the queue, not just the detail. */}
                  <Chip color={dispute.order.isPaidOut ? "danger" : undefined}>
                    <Chip.Label>
                      {dispute.order.isPaidOut ? t("paidOut") : t("held")}
                    </Chip.Label>
                  </Chip>
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
