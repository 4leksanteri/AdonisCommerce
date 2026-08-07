"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { ShoppingBag, TrashBin } from "@gravity-ui/icons";
import { Badge, Button, NumberField, Popover, Spinner } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { convertCents, currencyFormat, toMajorUnits } from "@/lib/format";
import { useCart } from "@/lib/cart/context";
import { useDisplayCurrency } from "@/lib/storefront/currency-context";
import type { CartLine } from "@/lib/cart/types";

/** Mirrors UNTRACKED_MAX_PER_ORDER on the product page. */
const UNTRACKED_MAX_PER_ORDER = 999;

function maxFor(line: CartLine) {
  return line.tracksInventory ? line.stockQuantity : UNTRACKED_MAX_PER_ORDER;
}

/**
 * Lines are grouped by shop because a cart can hold items priced in different
 * currencies, and EUR plus SEK has no meaningful sum. It also matches how
 * checkout has to work on a marketplace — one payment per seller.
 */
function groupByShop(lines: CartLine[]) {
  const shops = new Map<string, { name: string; slug: string; lines: CartLine[] }>();

  for (const line of lines) {
    const shop = shops.get(line.shopSlug) ?? {
      name: line.shopName,
      slug: line.shopSlug,
      lines: [],
    };
    shop.lines.push(line);
    shops.set(line.shopSlug, shop);
  }

  return [...shops.values()];
}

export function CartPopover() {
  const t = useTranslations("Cart");
  const format = useFormatter();
  const { lines, unavailable, isLoading, lineCount, items, setQuantity, remove } = useCart();
  const { displayCurrency, rates } = useDisplayCurrency();

  const quantityOf = (variantId: string) =>
    items.find((item) => item.variantId === variantId)?.quantity ?? 0;

  /**
   * Same rule as the storefront: convert into the shopper's chosen currency
   * when we can, otherwise leave the price in the seller's. Falling back per
   * line rather than globally means one missing rate doesn't unconvert the
   * whole cart.
   */
  const targetFor = (currency: string) =>
    displayCurrency && convertCents(100, currency, displayCurrency, rates) !== null
      ? displayCurrency
      : currency;

  const money = (cents: number, currency: string) => {
    const target = targetFor(currency);
    const amount = convertCents(cents, currency, target, rates) ?? cents;
    const formatted = format.number(toMajorUnits(amount), currencyFormat(target));
    return target === currency ? formatted : `≈ ${formatted}`;
  };

  const shops = groupByShop(lines);

  /**
   * Grouped by the currency each line is *displayed* in, so choosing a display
   * currency collapses a mixed-currency cart into one approximate total. With
   * no choice made, it falls back to one row per seller currency — adding EUR
   * to SEK would be nonsense.
   */
  const totals = [
    ...lines
      .reduce((byCurrency, line) => {
        const target = targetFor(line.currency);
        const cents = line.priceCents * quantityOf(line.variantId);
        const amount = convertCents(cents, line.currency, target, rates) ?? cents;
        return byCurrency.set(target, (byCurrency.get(target) ?? 0) + amount);
      }, new Map<string, number>())
      .entries(),
  ];

  return (
    <Popover>
      <Popover.Trigger
        aria-label={t("openCart")}
        className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-surface"
      >
        <Badge.Anchor className="flex size-6 items-center justify-center">
          <ShoppingBag className="size-6" />
          {lineCount > 0 && (
            <Badge color="danger" size="sm">
              {lineCount}
            </Badge>
          )}
        </Badge.Anchor>
      </Popover.Trigger>

      <Popover.Content placement="bottom end" className="w-96">
        <Popover.Dialog>
          <Popover.Heading>{t("heading")}</Popover.Heading>

          {lineCount === 0 ? (
            <p className="mt-3 text-sm text-muted">{t("empty")}</p>
          ) : isLoading && lines.length === 0 ? (
            <div className="mt-6 grid place-items-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <>
              {shops.map((shop) => {
                return (
                  <div key={shop.slug} className="mt-4 flex flex-col gap-3">
                    <p className="text-xs font-medium tracking-wide text-muted uppercase">
                      {shop.name}
                    </p>

                    {shop.lines.map((line) => {
                      const quantity = quantityOf(line.variantId);
                      const max = maxFor(line);

                      return (
                        <div key={line.variantId} className="flex items-start gap-3">
                          <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                            {line.imageUrl && (
                              <Image
                                src={line.imageUrl}
                                alt=""
                                width={48}
                                height={48}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <Link
                              href={{
                                pathname: "/shop/[shopSlug]/[productSlug]",
                                params: { shopSlug: line.shopSlug, productSlug: line.productSlug },
                              }}
                              className="truncate text-sm font-medium text-foreground no-underline"
                            >
                              {line.productTitle}
                            </Link>
                            {line.optionValues.length > 0 && (
                              <p className="truncate text-xs text-muted">
                                {line.optionValues.join(" / ")}
                              </p>
                            )}
                            <p className="text-xs text-muted">
                              {money(line.priceCents, line.currency)}
                            </p>

                            {/* Stock can fall below what's already in the cart,
                                so the ceiling is re-read on every render. */}
                            {quantity > max && (
                              <p className="text-xs text-danger">
                                {t("onlyLeft", { count: max })}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <NumberField
                              aria-label={t("quantity")}
                              minValue={1}
                              maxValue={max}
                              step={1}
                              value={quantity}
                              onChange={(value) =>
                                setQuantity(line.variantId, Number.isNaN(value) ? 1 : value)
                              }
                            >
                              <NumberField.Group className="w-24">
                                <NumberField.DecrementButton />
                                <NumberField.Input className="text-center" />
                                <NumberField.IncrementButton />
                              </NumberField.Group>
                            </NumberField>
                            <button
                              type="button"
                              aria-label={t("remove")}
                              onClick={() => remove(line.variantId)}
                              className="text-muted hover:text-danger"
                            >
                              <TrashBin className="size-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                );
              })}

              {unavailable.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
                  {unavailable.map((line) => (
                    <div key={line.variantId} className="flex items-center justify-between gap-2">
                      <p className="text-xs text-danger">{t("unavailable")}</p>
                      <button
                        type="button"
                        aria-label={t("remove")}
                        onClick={() => remove(line.variantId)}
                        className="text-muted hover:text-danger"
                      >
                        <TrashBin className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3">
                {totals.map(([currency, amount]) => (
                  <div key={currency} className="flex items-center justify-between">
                    <span className="text-sm text-muted">{t("subtotal")}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {displayCurrency && currency === displayCurrency && lines.some((l) => l.currency !== currency)
                        ? "≈ "
                        : ""}
                      {format.number(toMajorUnits(amount), currencyFormat(currency))}
                    </span>
                  </div>
                ))}
              </div>

              <Button className="mt-4" fullWidth isDisabled>
                {t("checkout")}
              </Button>
            </>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
