import "server-only";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Translations live on the API (single source of truth, admin-editable
 * later) rather than static JSON files here. Cached via Next's data cache
 * so this is an occasional refresh, not a live call on every render.
 */
async function getMessages(locale: string) {
  const res = await fetch(`${process.env.API_INTERNAL_URL}/api/translations/${locale}`, {
    next: { revalidate: 3600, tags: ["translations", `translations-${locale}`] },
  });

  if (!res.ok) {
    throw new Error(`Failed to load translations for locale "${locale}" (${res.status})`);
  }

  return res.json();
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await getMessages(locale),
  };
});
