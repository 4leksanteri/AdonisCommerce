import { getTranslations } from "next-intl/server";
import { CategoryManager } from "@/components/admin/category-manager";
import { getAdminCategories, requireAdmin } from "@/lib/admin/queries";

export default async function AdminCategoriesPage(props: PageProps<"/[locale]/admin/categories">) {
  const { locale } = await props.params;
  await requireAdmin(locale);

  const [categories, t] = await Promise.all([getAdminCategories(), getTranslations("Admin")]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("categoriesHeading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("categoriesSubheading")}</p>
      </div>

      <CategoryManager categories={categories} />
    </div>
  );
}
