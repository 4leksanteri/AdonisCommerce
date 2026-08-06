"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { CircleDollar } from "@gravity-ui/icons";
import { Dropdown, Label } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { SUPPORTED_CURRENCIES } from "@/lib/format";
import { setDisplayCurrencyAction } from "@/lib/storefront/actions";

/**
 * `current` is null until the shopper picks one, in which case prices stay in
 * each seller's own currency — see `getDisplayCurrency`.
 */
export function CurrencySwitcher({ current }: { current: string | null }) {
  const t = useTranslations("Storefront.currency");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(currency: string) {
    startTransition(async () => {
      await setDisplayCurrencyAction(currency);
      // Prices are rendered on the server from the cookie, so the new choice
      // only appears once the current route is re-rendered.
      router.refresh();
    });
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={t("change")}
        isDisabled={isPending}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <CircleDollar className="size-4" />
        {current ?? t("auto")}
      </Dropdown.Trigger>
      <Dropdown.Popover placement="top start">
        <Dropdown.Menu
          selectionMode="single"
          selectedKeys={new Set(current ? [current] : [])}
          onAction={(key) => select(String(key))}
        >
          {SUPPORTED_CURRENCIES.map((code) => (
            <Dropdown.Item key={code} id={code} textValue={code}>
              <Label>{code}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
