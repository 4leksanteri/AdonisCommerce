import { getTranslations } from "next-intl/server";
import { requireSeller } from "@/lib/seller/queries";
import { SellerSettingsForm } from "@/components/seller/settings-form";

export default async function SellerSettingsPage(props: PageProps<"/[locale]/seller/settings">) {
  const { locale } = await props.params;
  const { seller } = await requireSeller(locale);
  const t = await getTranslations("SellerPanel.settings");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
      </div>

      <SellerSettingsForm seller={seller} />
    </div>
  );
}
