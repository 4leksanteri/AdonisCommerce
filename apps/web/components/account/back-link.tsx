import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Mobile-only. The side nav is hidden below `md`, so a sub-page would
 * otherwise be a dead end — this is the way back up to the menu that
 * replaces it.
 */
export async function AccountBackLink() {
  const t = await getTranslations("Account.nav");

  return (
    <Link
      href="/account"
      className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent no-underline hover:underline md:hidden"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        aria-hidden
      >
        <polyline points="15,5 8,12 15,19" />
      </svg>
      {t("sectionLabel")}
    </Link>
  );
}
