import { getTranslations } from "next-intl/server";
import { getCategories, getShippingProfiles, requireSeller } from "@/lib/seller/queries";
import { ProductForm } from "@/components/seller/product-form";

export default async function NewSellerProductPage(
  props: PageProps<"/[locale]/seller/products/new">
) {
  const { locale } = await props.params;
  await requireSeller(locale);

  const [shippingProfiles, categories, t] = await Promise.all([
    getShippingProfiles(),
    getCategories(locale),
    getTranslations("SellerPanel.productForm"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[26px]">
          {t("heading")}
        </h1>
        <p className="mt-1.5 text-sm text-muted">{t("subheading")}</p>
      </div>

      <ProductForm shippingProfiles={shippingProfiles} categories={categories} />
    </div>
  );
}
