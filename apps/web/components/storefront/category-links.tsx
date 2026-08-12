import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getStorefrontCategories } from "@/lib/storefront/queries";

/**
 * The taxonomy as a row of links. Plain anchors to the category pages rather
 * than a filter control: these are the pages worth being found, and a
 * crawler follows links, not `onSelectionChange`.
 */
export async function CategoryLinks({ activeSlug }: { activeSlug?: string }) {
  const locale = await getLocale();
  const [categories, t] = await Promise.all([
    getStorefrontCategories(locale),
    getTranslations("Storefront.browse"),
  ]);

  if (categories.length === 0) return null;

  return (
    <nav aria-label={t("categoriesLabel")} className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = category.slug === activeSlug;

        return (
          <Link
            key={category.id}
            href={{ pathname: "/category/[categorySlug]", params: { categorySlug: category.slug } }}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm no-underline ${
              isActive
                ? "border-foreground text-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {category.name}
          </Link>
        );
      })}
    </nav>
  );
}
