import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ResultsPager } from "@/components/storefront/results-pager";
import { SortSelect } from "@/components/storefront/sort-select";
import { CategoryLinks } from "@/components/storefront/category-links";
import { searchProducts } from "@/lib/storefront/queries";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/storefront/types";

type Props = PageProps<"/[locale]/products">;

function readParams(raw: Awaited<Props["searchParams"]>) {
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? "";

  const sort = first(raw.sort);
  const page = Number(first(raw.page));

  return {
    q: first(raw.q).trim(),
    sort: (PRODUCT_SORTS as readonly string[]).includes(sort) ? (sort as ProductSort) : "newest",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const [{ q }, t] = await Promise.all([
    readParams(await props.searchParams),
    getTranslations("Storefront.browse"),
  ]);

  return {
    title: q ? t("resultsFor", { query: q }) : t("heading"),
    // Search results are thin, near-duplicate pages by nature; the category
    // pages are the ones built to be found.
    robots: { index: false, follow: true },
  };
}

export default async function ProductsPage(props: Props) {
  const { q, sort, page } = readParams(await props.searchParams);

  const [results, t] = await Promise.all([
    searchProducts({ q, sort, page }),
    getTranslations("Storefront.browse"),
  ]);

  // Carried into the pager's links so paging doesn't drop the search.
  const params = { ...(q ? { q } : {}), ...(sort !== "newest" ? { sort } : {}) };

  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {q ? t("resultsFor", { query: q }) : t("heading")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("resultCount", { count: results.total })}</p>
        </div>

        <CategoryLinks />

        <div className="flex justify-end">
          <SortSelect sort={sort} />
        </div>

        <ProductGrid
          products={results.products}
          emptyMessage={q ? t("noResults", { query: q }) : undefined}
        />

        <ResultsPager
          page={results.page}
          lastPage={results.lastPage}
          hrefFor={(target) => ({
            pathname: "/products",
            query: { ...params, ...(target > 1 ? { page: String(target) } : {}) },
          })}
        />
      </Container>
    </main>
  );
}
