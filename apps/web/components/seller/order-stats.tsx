import { getFormatter, getTranslations } from "next-intl/server";
import { Sparkline } from "@/components/seller/sparkline";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import type { OrderStats } from "@/lib/seller/types";

/** Percentage change, or null when there is no baseline to compare against. */
function change(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export async function OrderStatCards({ stats }: { stats: OrderStats }) {
  const [t, format] = await Promise.all([
    getTranslations("SellerPanel.orderStats"),
    getFormatter(),
  ]);

  const money = (cents: number) =>
    format.number(toMajorUnits(cents), currencyFormat(stats.currency));

  const ordersChange = change(stats.orders.total, stats.orders.previous);
  const salesChange = change(stats.sales.total, stats.sales.previous);

  const delta = (value: number | null, fallback: string) =>
    value === null
      ? { text: fallback, tone: "text-muted" }
      : {
          text: `${value >= 0 ? "↗" : "↘"} ${format.number(Math.abs(value) / 100, { style: "percent", maximumFractionDigits: 0 })} ${t("vsPrevious", { days: stats.days })}`,
          tone: value >= 0 ? "text-success" : "text-notice-foreground",
        };

  const cards = [
    {
      label: t("totalOrders"),
      value: format.number(stats.orders.total),
      series: stats.orders.series,
      line: "text-success",
      ...delta(ordersChange, t("noBaseline")),
    },
    {
      label: t("totalSales"),
      value: money(stats.sales.total),
      series: stats.sales.series,
      line: "text-accent",
      ...delta(salesChange, t("noBaseline")),
    },
    {
      label: t("openProblems"),
      value: format.number(stats.openProblems),
      series: [],
      line: "",
      text: stats.openProblems > 0 ? t("needsAction") : t("allClear"),
      tone: stats.openProblems > 0 ? "text-notice-foreground" : "text-muted",
    },
  ];

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-5"
        >
          <p className="text-[13px] text-muted">{card.label}</p>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[26px] font-bold tracking-tight whitespace-nowrap text-foreground">
                {card.value}
              </p>
              <p className={`mt-1 text-xs font-semibold ${card.tone}`}>{card.text}</p>
            </div>
            {card.series.length > 1 && <Sparkline series={card.series} className={card.line} />}
          </div>
        </div>
      ))}
    </div>
  );
}
