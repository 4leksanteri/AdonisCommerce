import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Stable ordering. The counts decide *which* tabs exist — a shop with no
 * disputes is not shown an empty "Problems" tab inviting it to look for
 * trouble — but not what order they come in, or they would reshuffle
 * themselves every time a sale landed.
 */
const ORDER = ["paid", "accepted", "shipped", "disputed", "completed", "cancelled"] as const;

export async function OrderStatusTabs({
  counts,
  active,
}: {
  counts: Record<string, number>;
  active?: string;
}) {
  const [t, tStatus] = await Promise.all([
    getTranslations("SellerPanel.orders"),
    getTranslations("Order.status"),
  ]);

  const present = ORDER.filter((status) => (counts[status] ?? 0) > 0);
  // Statuses the vocabulary has since moved on from still have rows behind
  // them; showing them is better than a tab total that doesn't add up.
  const unknown = Object.keys(counts).filter(
    (status) => !(ORDER as readonly string[]).includes(status)
  );
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const tabs = [
    { key: undefined, label: t("tabAll"), count: total },
    ...[...present, ...unknown].map((status) => ({
      key: status,
      label: tStatus(status as "pending"),
      count: counts[status] ?? 0,
    })),
  ];

  if (tabs.length < 2) return null;

  return (
    <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] border border-field-border bg-selected p-[3px]">
      {tabs.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link
            key={tab.key ?? "all"}
            href={
              tab.key
                ? { pathname: "/seller/orders", query: { status: tab.key } }
                : "/seller/orders"
            }
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap no-underline ${
              isActive
                ? "bg-surface text-foreground shadow-tab"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="text-[11px] font-semibold text-muted-soft">{tab.count}</span>
          </Link>
        );
      })}
    </div>
  );
}
