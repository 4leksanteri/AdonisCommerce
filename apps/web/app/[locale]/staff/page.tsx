import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { getStaffOverview, requireStaff } from "@/lib/staff/queries";

/** A number and what it means, with a way to act on it when there is one. */
function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "attention";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`text-2xl font-semibold ${tone === "attention" ? "text-danger" : "text-foreground"}`}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export default async function StaffOverviewPage(props: PageProps<"/[locale]/staff">) {
  const { locale } = await props.params;
  await requireStaff(locale);

  const [overview, t, format] = await Promise.all([
    getStaffOverview(),
    getTranslations("Staff"),
    getFormatter(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("overviewHeading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("overviewSubheading")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label={t("statOpenDisputes")}
          value={String(overview.openDisputes)}
          tone={overview.openDisputes > 0 ? "attention" : undefined}
          hint={
            overview.oldestDisputeAt
              ? t("statOldest", {
                  ago: format.relativeTime(new Date(overview.oldestDisputeAt)),
                })
              : undefined
          }
        />

        <Stat label={t("statSettled")} value={String(overview.settledLastWeek)} />

        {/* Only surfaced when it isn't zero: a permanent "0 problems" tile is
            noise, and noise is what people learn to skip past. */}
        <Stat
          label={t("statStuckPayouts")}
          value={String(overview.stuckPayouts)}
          tone={overview.stuckPayouts > 0 ? "attention" : undefined}
          hint={overview.stuckPayouts > 0 ? t("statStuckHint") : undefined}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div>
          <h2 className="font-medium text-foreground">{t("heldHeading")}</h2>
          <p className="mt-1 text-sm text-muted">{t("heldSubheading")}</p>
        </div>

        {overview.heldPayouts.length === 0 ? (
          <p className="text-sm text-muted">{t("heldNone")}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {overview.heldPayouts.map((held) => (
              <li key={held.currency} className="flex justify-between">
                <span className="text-muted">
                  {t("heldOrders", { count: held.orders, currency: held.currency })}
                </span>
                <span className="text-foreground">
                  {format.number(toMajorUnits(held.cents), currencyFormat(held.currency))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {overview.openDisputes > 0 && (
        <Link
          href="/staff/disputes"
          className="w-fit rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background no-underline"
        >
          {t("goToDisputes")}
        </Link>
      )}
    </div>
  );
}
