import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireSeller, getSellerProduct } from "@/lib/seller/queries";
import { ProductForm } from "@/components/seller/product-form";

export default async function EditSellerProductPage(
  props: PageProps<"/[locale]/seller/products/[id]">
) {
  const { locale, id } = await props.params;
  await requireSeller(locale);

  const [product, t] = await Promise.all([
    getSellerProduct(id),
    getTranslations("SellerPanel.productForm"),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("editHeading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("editSubheading")}</p>
      </div>

      <ProductForm product={product} />
    </div>
  );
}
