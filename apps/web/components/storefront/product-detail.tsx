"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import {
  Button,
  Chip,
  Label,
  NumberField,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "@heroui/react";
import {
  convertCents,
  currencyFormat,
  toMajorUnits,
  type ExchangeRates,
} from "@/lib/format";
import { useCart } from "@/lib/cart/context";
import { shippingCentsFor } from "@/lib/storefront/shipping";
import { ShipToSelect } from "./ship-to-select";
import type { PublicProduct, PublicProductVariant } from "@/lib/storefront/types";

/**
 * Selection is tracked as option-value *ids*, one per option, not as the
 * displayed strings. Two options on the same product can legitimately share
 * a value name ("Size: Small" alongside "Pouch: Small"), which would make
 * name-based matching pick the wrong variant.
 */
type Selection = (string | undefined)[];

function findVariant(
  variants: PublicProductVariant[],
  selection: Selection
): PublicProductVariant | undefined {
  const chosen = selection.filter((id): id is string => id !== undefined);
  if (chosen.length !== selection.length) return undefined;

  return variants.find((variant) => {
    const ids = variant.optionValues.map((optionValue) => optionValue.id);
    return ids.length === chosen.length && chosen.every((id) => ids.includes(id));
  });
}

/**
 * A sanity ceiling, not a statement about what the seller can make — if an
 * order is too large to fulfil, they cancel it, and they're better placed to
 * judge that than a constant here. This exists only so the quantity field has
 * some upper bound: without one a stray keystroke turns 5 into 5000, and an
 * unbounded field is a soft target for card-testing.
 */
const UNTRACKED_MAX_PER_ORDER = 999;

/**
 * The single place stock is interpreted. A product that doesn't track
 * inventory is always available, so every decision below asks this rather
 * than comparing `stockQuantity` directly — a bare `> 0` would read an
 * untracked listing as sold out.
 */
function isAvailable(variant: PublicProductVariant | undefined, tracksInventory: boolean) {
  if (variant === undefined) return false;
  return !tracksInventory || variant.stockQuantity > 0;
}

type Props = {
  product: PublicProduct;
  /** Null means the shopper hasn't picked one — show the seller's currency. */
  displayCurrency: string | null;
  rates: ExchangeRates;
  shipToCountry: string;
};

export function ProductDetail({ product, displayCurrency, rates, shipToCountry }: Props) {
  const t = useTranslations("Storefront.product");
  const format = useFormatter();
  const { add } = useCart();

  const native = product.currency;
  // Falls back to the seller's currency when conversion isn't possible, so a
  // missing rate shows a correct price rather than none.
  const target =
    displayCurrency && convertCents(100, native, displayCurrency, rates) !== null
      ? displayCurrency
      : native;
  const isConverted = target !== native;

  const formatIn = (cents: number, currency: string) =>
    format.number(toMajorUnits(cents), currencyFormat(currency));
  const formatPrice = (cents: number) =>
    formatIn(convertCents(cents, native, target, rates) ?? cents, target);

  /** The option-value ids of `variant`, laid out in product option order. */
  const selectionFor = useMemo(
    () =>
      (variant: PublicProductVariant | undefined): Selection =>
        product.options.map(
          (option) =>
            variant?.optionValues.find((optionValue) =>
              option.values.some((value) => value.id === optionValue.id)
            )?.id
        ),
    [product.options]
  );

  // Open on something buyable rather than an empty state the shopper has
  // to resolve themselves.
  const [selection, setSelection] = useState<Selection>(() =>
    selectionFor(
      product.variants.find((variant) => isAvailable(variant, product.tracksInventory)) ??
        product.variants[0]
    )
  );

  const [activeImage, setActiveImage] = useState(0);
  const [desiredQuantity, setDesiredQuantity] = useState(1);

  const selectedVariant = useMemo(
    () => findVariant(product.variants, selection),
    [product.variants, selection]
  );

  const priceRange = useMemo(() => {
    const prices = product.variants.map((variant) => variant.priceCents);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [product.variants]);

  /**
   * Offered if *any* in-stock variant carries this value. Testing it against
   * the rest of the current selection instead would dead-end the shopper:
   * with Small selected, Rose would grey out because Rose/Small is sold out,
   * hiding the in-stock Rose/Large behind a disabled button.
   */
  function isValueOffered(valueId: string) {
    return product.variants.some(
      (variant) =>
        isAvailable(variant, product.tracksInventory) &&
        variant.optionValues.some((optionValue) => optionValue.id === valueId)
    );
  }

  function selectValue(optionIndex: number, valueId: string) {
    setSelection((prev) => {
      const next = prev.map((chosen, i) => (i === optionIndex ? valueId : chosen));
      if (isAvailable(findVariant(product.variants, next), product.tracksInventory)) return next;

      // The new combination isn't buyable, so adopt the other options from
      // the first in-stock variant carrying the value just picked — choosing
      // Rose slides Size to Large instead of landing on sold-out Rose/Small.
      const repair = product.variants.find(
        (variant) =>
          isAvailable(variant, product.tracksInventory) &&
          variant.optionValues.some((optionValue) => optionValue.id === valueId)
      );

      return repair ? selectionFor(repair) : next;
    });
  }

  const images = product.images;
  const tracksInventory = product.tracksInventory;
  const isUnavailable = selectedVariant === undefined;
  const isSoldOut =
    selectedVariant !== undefined && !isAvailable(selectedVariant, tracksInventory);

  const maxQuantity = !tracksInventory
    ? UNTRACKED_MAX_PER_ORDER
    : (selectedVariant?.stockQuantity ?? 1);
  /**
   * Derived rather than synced through an effect. Switching to a variant with
   * less stock must never leave an unbuyable number on screen, not even for a
   * frame — and keeping the *desired* figure separately means switching back
   * to a well-stocked variant restores what the shopper actually asked for.
   */
  const quantity = Math.min(desiredQuantity, Math.max(maxQuantity, 1));

  // A one-of-a-kind listing — most of them, on a handmade marketplace — has
  // nothing to choose, and a control locked at 1 reads as broken.
  const showQuantity = !isUnavailable && !isSoldOut && maxQuantity > 1;

  /**
   * Quoted for the chosen destination *and* the chosen quantity, because both
   * move the number — a second item adds only the additional-item rate. Uses
   * the same formula as the API so checkout can't disagree with this page.
   */
  const shipping = shippingCentsFor(product.shippingRates, shipToCountry, quantity);
  const isFreeShipping = product.shippingRates.length === 0;

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="flex flex-col gap-3">
        <div className="aspect-square overflow-hidden rounded-xl border border-border bg-surface">
          {images[activeImage] && (
            <Image
              src={images[activeImage].url}
              alt={product.title}
              width={800}
              height={800}
              unoptimized
              priority
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {images.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={t("viewImage", { number: index + 1 })}
                aria-current={index === activeImage ? "true" : undefined}
                onClick={() => setActiveImage(index)}
                className={`size-16 overflow-hidden rounded-lg border ${
                  index === activeImage ? "border-foreground" : "border-border"
                }`}
              >
                <Image
                  src={image.url}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{product.shop.name}</p>
          <h1 className="text-2xl font-semibold text-foreground">{product.title}</h1>
          <p className="text-xl text-foreground">
            {isConverted && "≈ "}
            {selectedVariant
              ? formatPrice(selectedVariant.priceCents)
              : priceRange.min === priceRange.max
                ? formatPrice(priceRange.min)
                : `${formatPrice(priceRange.min)}–${formatPrice(priceRange.max)}`}
          </p>
          {/* The seller prices and is paid in their own currency, so the
              converted figure above is only ever an estimate. Say so, and
              show the real number rather than burying it. */}
          {isConverted && (
            <p className="text-sm text-muted">
              {t("approximateFrom", {
                price: selectedVariant
                  ? formatIn(selectedVariant.priceCents, native)
                  : formatIn(priceRange.min, native),
              })}
            </p>
          )}
        </div>

        {product.options.map((option, optionIndex) => (
          <div key={option.id} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{option.name}</p>
            <ToggleButtonGroup
              selectionMode="single"
              disallowEmptySelection
              aria-label={option.name}
              selectedKeys={selection[optionIndex] ? [selection[optionIndex]] : []}
              onSelectionChange={(keys) => {
                const [first] = [...keys];
                if (first !== undefined) selectValue(optionIndex, String(first));
              }}
            >
              {option.values.map((value) => (
                <ToggleButton key={value.id} id={value.id} isDisabled={!isValueOffered(value.id)}>
                  {value.value}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
        ))}

        {showQuantity && (
          <NumberField
            minValue={1}
            // React Aria clamps typing and stepping against this; the derived
            // `quantity` above covers the case it can't see — the shopper
            // switching variant without touching the field.
            maxValue={maxQuantity}
            step={1}
            value={quantity}
            onChange={(value) => setDesiredQuantity(Number.isNaN(value) ? 1 : value)}
          >
            <Label>{t("quantityLabel")}</Label>
            <NumberField.Group className="w-32">
              <NumberField.DecrementButton />
              <NumberField.Input className="text-center" />
              <NumberField.IncrementButton />
            </NumberField.Group>
          </NumberField>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{t("shipTo")}</span>
            <ShipToSelect />
          </div>

          <p className="text-sm text-foreground">
            {isFreeShipping
              ? t("shippingFree")
              : !shipping.deliverable
                ? t("shippingUnavailable")
                : t("shippingCost", { cost: formatPrice(shipping.cents) })}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {isUnavailable ? (
            <Chip color="danger">
              <Chip.Label>{t("combinationUnavailable")}</Chip.Label>
            </Chip>
          ) : isSoldOut ? (
            <Chip color="danger">
              <Chip.Label>{t("soldOut")}</Chip.Label>
            </Chip>
          ) : (
            // Nothing to run low on when inventory isn't tracked.
            tracksInventory &&
            selectedVariant.stockQuantity <= 5 && (
              <Chip>
                <Chip.Label>{t("lowStock", { count: selectedVariant.stockQuantity })}</Chip.Label>
              </Chip>
            )
          )}

          <Button
            className="self-start"
            isDisabled={isUnavailable || isSoldOut || !shipping.deliverable}
            onPress={() => {
              if (!selectedVariant) return;
              // The cart stores the id and count only; price and stock are
              // re-read from the API, so this can't pin a stale price.
              add(selectedVariant.id, quantity);
              toast.success(t("addedToCart"));
            }}
          >
            {t("addToCart")}
          </Button>
        </div>

        {product.description && (
          <div className="flex flex-col gap-2 border-t border-border pt-6">
            <h2 className="font-medium text-foreground">{t("descriptionHeading")}</h2>
            <p className="text-sm whitespace-pre-line text-muted">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
