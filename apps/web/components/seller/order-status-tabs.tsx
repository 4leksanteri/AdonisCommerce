import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * One set of chips at every width. They were a segmented control on desktop
 * and pills on a phone, which was two things to keep in step for no gain —
 * pills read perfectly well at any width.
 *
 * Wrapped, never scrolled. A horizontal scroller hides whichever statuses
 * fall off the edge and gives no sign they are there, and the one a seller
 * wants is as likely to be last as first.
 *
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
    <div className="flex flex-wrap gap-1.5">
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
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap no-underline ${
              isActive
                ? "border-accent bg-accent-soft text-accent-soft-strong"
                : "border-field-border bg-surface text-muted-strong hover:border-muted-soft hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="text-[11px] font-semibold opacity-55">{tab.count}</span>
          </Link>
        );
      })}
    </div>
  );
}
