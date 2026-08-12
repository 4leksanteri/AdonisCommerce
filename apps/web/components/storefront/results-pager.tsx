import type { ComponentProps } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = {
  page: number;
  lastPage: number;
  /**
   * Built by the caller, because only it knows its own route — the results
   * page keeps its filters in the query string, a category page keeps one of
   * them in the path.
   */
  hrefFor: (page: number) => ComponentProps<typeof Link>["href"];
};

/**
 * Deliberately links rather than buttons. A pager built from `onPress` is
 * invisible to a crawler, which means page two of a category is invisible
 * too — and browse pages exist to be found.
 */
export async function ResultsPager({ page, lastPage, hrefFor }: Props) {
  const t = await getTranslations("Storefront.browse");
  if (lastPage <= 1) return null;

  const linkClass =
    "rounded-lg border border-border px-3 py-2 text-sm text-foreground no-underline hover:bg-surface";

  return (
    <nav className="flex items-center justify-between gap-4" aria-label={t("pagination")}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
          {t("previous")}
        </Link>
      ) : (
        <span />
      )}

      <span className="text-sm text-muted">{t("pageOf", { page, lastPage })}</span>

      {page < lastPage ? (
        <Link href={hrefFor(page + 1)} rel="next" className={linkClass}>
          {t("next")}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
