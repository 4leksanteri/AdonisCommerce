"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Form, SearchField as HeroSearchField } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";

/**
 * The header search. A real form, so Enter submits and the browser offers
 * previous searches — and so it still works before the page has hydrated.
 */
export function SearchField({ defaultValue = "" }: { defaultValue?: string }) {
  const t = useTranslations("Storefront.browse");
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? { pathname: "/products", query: { q } } : { pathname: "/products" });
  }

  return (
    <Form onSubmit={handleSubmit} className="hidden sm:block">
      <HeroSearchField
        aria-label={t("searchLabel")}
        value={value}
        onChange={setValue}
        // Clearing the box is a search for everything, not a dead end.
        onClear={() => router.push({ pathname: "/products" })}
      >
        <HeroSearchField.Group>
          <HeroSearchField.SearchIcon />
          <HeroSearchField.Input className="w-40 lg:w-56" placeholder={t("searchPlaceholder")} />
          <HeroSearchField.ClearButton />
        </HeroSearchField.Group>
      </HeroSearchField>
    </Form>
  );
}
