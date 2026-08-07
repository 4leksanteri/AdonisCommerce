"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { ShoppingBag, TrashBin } from "@gravity-ui/icons";
import { Badge, Button, NumberField, Popover, Spinner } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { convertCents, currencyFormat, toMajorUnits } from "@/lib/format";
import { useCart } from "@/lib/cart/context";
import { useStorefrontPreferences } from "@/lib/storefront/preferences-context";
import { shippingCentsFor } from "@/lib/storefront/shipping";
import { ShipToSelect } from "@/components/storefront/ship-to-select";
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
  const { displayCurrency, rates, shipToCountry } = useStorefrontPreferences();

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
   * Shipping is billed per seller and, within a seller, per profile — items
   * sharing a parcel are charged once. So it's computed over the shop groups
   * rather than line by line, matching what the order endpoint will charge.
   */
  const shippingByShop = new Map<string, { cents: number; currency: string; deliverable: boolean }>();
  for (const shop of shops) {
    const byProfile = new Map<string, { rates: typeof shop.lines[number]["shippingRates"]; quantity: number }>();

    for (const line of shop.lines) {
      if (!line.shippingProfileId) continue;
      const entry = byProfile.get(line.shippingProfileId);
      byProfile.set(line.shippingProfileId, {
        rates: line.shippingRates,
        quantity: (entry?.quantity ?? 0) + quantityOf(line.variantId),
      });
    }

    let cents = 0;
    let deliverable = true;
    for (const { rates: profileRates, quantity } of byProfile.values()) {
      const quote = shippingCentsFor(profileRates, shipToCountry, quantity);
      if (!quote.deliverable) deliverable = false;
      cents += quote.cents;
    }

    shippingByShop.set(shop.slug, { cents, currency: shop.lines[0].currency, deliverable });
  }

  /**
   * Grouped by the currency each amount is *displayed* in, so choosing a
   * display currency collapses a mixed-currency cart into one set of figures.
   * With no choice made, it falls back to one block per seller currency —
   * adding EUR to SEK would be nonsense.
   */
  const totals = new Map<string, { subtotal: number; shipping: number }>();
  const addTo = (currency: string, key: "subtotal" | "shipping", cents: number) => {
    const target = targetFor(currency);
    const amount = convertCents(cents, currency, target, rates) ?? cents;
    const entry = totals.get(target) ?? { subtotal: 0, shipping: 0 };
    entry[key] += amount;
    totals.set(target, entry);
  };

  for (const line of lines) {
    addTo(line.currency, "subtotal", line.priceCents * quantityOf(line.variantId));
  }
  for (const shipping of shippingByShop.values()) {
    addTo(shipping.currency, "shipping", shipping.cents);
  }

  const hasUndeliverable = [...shippingByShop.values()].some((s) => !s.deliverable);

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

      <Popover.Content placement="bottom end" className="w-[26rem]">
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
                              {/* The steppers take a fixed 40px each, so the
                                  input keeps only what's left — its default
                                  side padding alone would swallow that and
                                  clip the digits. */}
                              <NumberField.Group className="w-32">
                                <NumberField.DecrementButton />
                                <NumberField.Input className="min-w-0 flex-1 px-1 text-center" />
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

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-sm text-muted">{t("shipTo")}</span>
                <ShipToSelect />
              </div>

              <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
                {[...totals.entries()].map(([currency, amount]) => {
                  const approx =
                    displayCurrency &&
                    currency === displayCurrency &&
                    lines.some((line) => line.currency !== currency)
                      ? "≈ "
                      : "";
                  const money = (cents: number) =>
                    `${approx}${format.number(toMajorUnits(cents), currencyFormat(currency))}`;

                  return (
                    <div key={currency} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm text-muted">
                        <span>{t("subtotal")}</span>
                        <span>{money(amount.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted">
                        <span>{t("shipping")}</span>
                        <span>{amount.shipping === 0 ? t("shippingFree") : money(amount.shipping)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-1">
                        <span className="text-sm font-medium text-foreground">{t("total")}</span>
                        <span className="text-sm font-semibold text-foreground">
                          {money(amount.subtotal + amount.shipping)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {hasUndeliverable && (
                  <p className="text-xs text-danger">{t("someUndeliverable")}</p>
                )}
              </div>

              <Button className="mt-4" fullWidth isDisabled={hasUndeliverable || true}>
                {t("checkout")}
              </Button>
            </>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
