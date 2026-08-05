"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Globe } from "@gravity-ui/icons";
import { Dropdown, Label } from "@heroui/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  fi: "Suomi",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Footer");
  const router = useRouter();
  const pathname = usePathname();
  // Dynamic pathnames (e.g. /seller/products/[id]) need their params to be
  // re-filled when the locale changes, so the switcher stays on the same page.
  const params = useParams();

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={t("changeLanguage")}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <Globe className="size-4" />
        {LOCALE_LABELS[locale]}
      </Dropdown.Trigger>
      <Dropdown.Popover placement="top start">
        <Dropdown.Menu
          selectionMode="single"
          selectedKeys={new Set([locale])}
          onAction={(key) =>
            router.replace(
              // @ts-expect-error -- TypeScript only knows that `params` has to
              // line up with `pathname`, not that it already does. For the
              // route we're currently on, the two always match.
              { pathname, params },
              { locale: String(key) }
            )
          }
        >
          {routing.locales.map((code) => (
            <Dropdown.Item key={code} id={code} textValue={LOCALE_LABELS[code]}>
              <Label>{LOCALE_LABELS[code]}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
