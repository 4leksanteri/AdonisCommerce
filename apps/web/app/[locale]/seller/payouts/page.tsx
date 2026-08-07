import { getTranslations } from "next-intl/server";
import { PayoutsPanel } from "@/components/seller/payouts-panel";
import { getPayoutDetails, requireSeller } from "@/lib/seller/queries";

export default async function SellerPayoutsPage(props: PageProps<"/[locale]/seller/payouts">) {
  const { locale } = await props.params;
  await requireSeller(locale);

  const [details, t] = await Promise.all([
    getPayoutDetails(),
    getTranslations("SellerPanel.payouts"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
      </div>

      <PayoutsPanel details={details} />
    </div>
  );
}
