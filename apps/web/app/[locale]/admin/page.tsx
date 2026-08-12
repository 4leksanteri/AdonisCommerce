import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { getAdminOverview, requireAdmin } from "@/lib/admin/queries";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border p-4">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

export default async function AdminOverviewPage(props: PageProps<"/[locale]/admin">) {
  const { locale } = await props.params;
  await requireAdmin(locale);

  const [overview, t, format] = await Promise.all([
    getAdminOverview(),
    getTranslations("Admin"),
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
          label={t("statUsers")}
          value={String(overview.users.total)}
          hint={t("statUsersHint", {
            team: overview.users.team,
            recent: overview.users.newThisWeek,
          })}
        />
        {/* A shop that can't take payments can't sell, so the two numbers
            belong on the same tile. */}
        <Stat
          label={t("statShops")}
          value={String(overview.shops.total)}
          hint={t("statShopsHint", { payable: overview.shops.payable })}
        />
        <Stat
          label={t("statListings")}
          value={String(overview.listings.active)}
          hint={
            overview.listings.uncategorised > 0
              ? t("statUncategorised", {
                  count: overview.listings.uncategorised,
                })
              : undefined
          }
        />
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-border p-4">
        <div>
          <h2 className="font-medium text-foreground">{t("commissionHeading")}</h2>
          <p className="mt-1 text-sm text-muted">{t("commissionSubheading")}</p>
        </div>

        {overview.commission.length === 0 ? (
          <p className="text-sm text-muted">{t("commissionNone")}</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {overview.commission.map((row) => (
              <li key={row.currency} className="flex justify-between">
                <span className="text-muted">
                  {t("commissionOrders", {
                    count: row.orders,
                    currency: row.currency,
                  })}
                </span>
                <span className="text-foreground">
                  {format.number(toMajorUnits(row.cents), currencyFormat(row.currency))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {overview.listings.uncategorised > 0 && (
        <Link
          href="/admin/categories"
          className="w-fit rounded-card bg-foreground px-4 py-2 text-sm font-medium text-background no-underline"
        >
          {t("goToCategories")}
        </Link>
      )}
    </div>
  );
}
