import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPathname, redirect } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ResultsPager } from "@/components/storefront/results-pager";
import { SortSelect } from "@/components/storefront/sort-select";
import { CategoryLinks } from "@/components/storefront/category-links";
import { getCategoryBySlug, searchProducts } from "@/lib/storefront/queries";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/storefront/types";

type Props = PageProps<"/[locale]/category/[categorySlug]">;

function readParams(raw: Awaited<Props["searchParams"]>) {
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? "";

  const sort = first(raw.sort);
  const page = Number(first(raw.page));

  return {
    sort: (PRODUCT_SORTS as readonly string[]).includes(sort) ? (sort as ProductSort) : "newest",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, categorySlug } = await props.params;
  const category = await getCategoryBySlug(categorySlug, locale);

  if (!category) return {};

  // Always the canonical slug, never the one that was asked for — otherwise
  // the same listing is two pages competing with each other.
  const canonical = getPathname({
    locale,
    href: { pathname: "/category/[categorySlug]", params: { categorySlug: category.slug } },
  });

  return { title: category.name, alternates: { canonical } };
}

export default async function CategoryPage(props: Props) {
  const [{ locale, categorySlug }, { sort, page }] = await Promise.all([
    props.params,
    readParams(await props.searchParams),
  ]);

  const category = await getCategoryBySlug(categorySlug, locale);
  if (!category) notFound();

  /**
   * Switching language on this page hands the new route the old language's
   * slug: next-intl translates `/kategoria` to `/category`, but nothing
   * translates `keittio-ja-ruokailu`. The API resolves either, and this sends
   * the reader on to the right URL rather than serving a Finnish slug under
   * an English path.
   */
  if (category.slug !== categorySlug) {
    redirect({
      href: { pathname: "/category/[categorySlug]", params: { categorySlug: category.slug } },
      locale,
    });
  }

  const [results, t] = await Promise.all([
    searchProducts({ category: category.slug, sort, page }),
    getTranslations("Storefront.browse"),
  ]);

  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{category.name}</h1>
          <p className="mt-1 text-sm text-muted">{t("resultCount", { count: results.total })}</p>
        </div>

        <CategoryLinks activeSlug={category.slug} />

        <div className="flex justify-end">
          <SortSelect sort={sort} />
        </div>

        <ProductGrid
          products={results.products}
          emptyMessage={t("emptyCategory", { category: category.name })}
        />

        <ResultsPager
          page={results.page}
          lastPage={results.lastPage}
          hrefFor={(target) => ({
            pathname: "/category/[categorySlug]",
            params: { categorySlug: category.slug },
            query: {
              ...(sort !== "newest" ? { sort } : {}),
              ...(target > 1 ? { page: String(target) } : {}),
            },
          })}
        />
      </Container>
    </main>
  );
}
