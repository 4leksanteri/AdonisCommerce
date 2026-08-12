import { getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { requireSeller } from "@/lib/seller/queries";

const STATUS_COLOR = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
} as const;

const PAYOUT_COLOR = {
  connected: "success",
  not_connected: "warning",
  restricted: "danger",
} as const;

export default async function SellerDashboardPage(props: PageProps<"/[locale]/seller">) {
  const { locale } = await props.params;
  const { seller } = await requireSeller(locale);

  const t = await getTranslations("SellerPanel.dashboard");
  const tStatus = await getTranslations("SellerPanel.status");
  const tPayout = await getTranslations("SellerPanel.payout");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[26px]">
          {t("heading", { shopName: seller.shopName })}
        </h1>
        <p className="mt-1.5 text-sm text-muted">{t("subheading")}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Chip color={STATUS_COLOR[seller.status as keyof typeof STATUS_COLOR]}>
          <Chip.Label>{tStatus(seller.status as Parameters<typeof tStatus>[0])}</Chip.Label>
        </Chip>
        <Chip color={PAYOUT_COLOR[seller.payoutStatus as keyof typeof PAYOUT_COLOR]}>
          <Chip.Label>{tPayout(seller.payoutStatus as Parameters<typeof tPayout>[0])}</Chip.Label>
        </Chip>
      </div>

      <div className="rounded-lg border border-border p-4 text-sm text-muted">
        {t("moreComingSoon")}
      </div>
    </div>
  );
}
