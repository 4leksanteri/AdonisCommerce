import { getTranslations } from "next-intl/server";
import { requireSeller, getShippingProfiles } from "@/lib/seller/queries";
import { ShippingProfiles } from "@/components/seller/shipping-profiles";

export default async function SellerShippingPage(props: PageProps<"/[locale]/seller/shipping">) {
  const { locale } = await props.params;
  const { seller } = await requireSeller(locale);

  const [profiles, t] = await Promise.all([
    getShippingProfiles(),
    getTranslations("SellerPanel.shipping"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
      </div>

      <ShippingProfiles
        profiles={profiles}
        currency={seller.currency}
        sellerCountry={seller.country}
      />
    </div>
  );
}
