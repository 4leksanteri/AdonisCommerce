import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { ProductGrid } from "@/components/storefront/product-grid";
import { CategoryLinks } from "@/components/storefront/category-links";
import { getStorefrontProducts } from "@/lib/storefront/queries";

export default async function Home() {
  const [products, t, tBrowse] = await Promise.all([
    getStorefrontProducts(),
    getTranslations("Storefront.home"),
    getTranslations("Storefront.browse"),
  ]);

  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
        </div>

        <CategoryLinks />

        <ProductGrid products={products} emptyMessage={t("empty")} />

        {/* The grid is one page of the newest listings, so there has to be a
            way through to the rest of the catalogue. */}
        {products.length > 0 && (
          <Link href="/products" className="self-center text-sm text-muted hover:text-foreground">
            {tBrowse("seeAll")}
          </Link>
        )}
      </Container>
    </main>
  );
}
