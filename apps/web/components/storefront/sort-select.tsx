"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Label, ListBox, Select } from "@heroui/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/storefront/types";

/**
 * Changing the sort rewrites the URL rather than holding it in state, so the
 * order someone is looking at is the order they can send to a friend — and
 * the page stays a server render.
 */
export function SortSelect({ sort }: { sort: ProductSort }) {
  const t = useTranslations("Storefront.browse");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function change(value: ProductSort) {
    const params = new URLSearchParams(searchParams);
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    // Back to the first page: page four of one ordering is nowhere in another.
    params.delete("page");

    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}` as Parameters<typeof router.push>[0]);
  }

  return (
    <Select
      className="w-56"
      selectedKey={sort}
      onSelectionChange={(key) => change(String(key) as ProductSort)}
    >
      <Label>{t("sortLabel")}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {PRODUCT_SORTS.map((option) => (
            <ListBox.Item key={option} id={option} textValue={t(`sort.${option}`)}>
              {t(`sort.${option}`)}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
