import { getLocale } from "next-intl/server";

/**
 * A country code as its name in the reader's language.
 *
 * A component rather than a helper because it has to stand alone. Finnish
 * inflects place names — a parcel comes *Suomesta*, not *Suomi* — and
 * `Intl.DisplayNames` only ever returns the nominative. So the name is never
 * written into a sentence; it sits beside its own label and the surrounding
 * copy stays free of it. Same reasoning as the ship-to control on the
 * product page.
 */
export async function CountryName({ code }: { code: string }) {
  const locale = await getLocale();
  const names = new Intl.DisplayNames([locale], { type: "region" });

  return <>{names.of(code.toUpperCase()) ?? code.toUpperCase()}</>;
}
