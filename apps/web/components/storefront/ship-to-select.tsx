"use client";

import { useMemo, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Label, ListBox, Select } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { setShipToCountryAction } from "@/lib/storefront/actions";
import { useStorefrontPreferences } from "@/lib/storefront/preferences-context";
import { SHIP_TO_COUNTRIES } from "@/lib/storefront/shipping";

/**
 * The destination lives in its own labelled control rather than inside a
 * sentence like "Shipping to {country}".
 *
 * Finnish country names inflect — it's "Toimitus **Alankomaihin**", not
 * "Alankomaat" — and no formatting API produces those endings. Keeping the
 * name standalone means `Intl.DisplayNames`' nominative is always the right
 * form. Amazon and Etsy both separate the two for the same reason.
 */
export function ShipToSelect({
  label,
  triggerClassName = "min-w-40",
}: {
  label?: string;
  /** The trigger only — the popover is the same list wherever it opens. */
  triggerClassName?: string;
}) {
  const t = useTranslations("Storefront.product");
  const locale = useLocale();
  const router = useRouter();
  const { shipToCountry } = useStorefrontPreferences();
  const [isPending, startTransition] = useTransition();

  const countryName = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    return (code: string) => names.of(code) ?? code;
  }, [locale]);

  return (
    <Select
      aria-label={t("shipTo")}
      isDisabled={isPending}
      selectedKey={shipToCountry}
      onSelectionChange={(key) =>
        startTransition(async () => {
          await setShipToCountryAction(String(key));
          // Quotes are rendered from a server-read cookie, so the route has to
          // re-render before the new destination applies.
          router.refresh();
        })
      }
    >
      {label !== undefined && <Label>{label}</Label>}
      <Select.Trigger className={triggerClassName}>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {SHIP_TO_COUNTRIES.map((code) => (
            <ListBox.Item key={code} id={code} textValue={countryName(code)}>
              {countryName(code)}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
