"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { Button, Chip, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { currencyFormat, toMajorUnits } from "@/lib/format";
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

function isInStock(variant: PublicProductVariant | undefined) {
  return variant !== undefined && variant.stockQuantity > 0;
}

export function ProductDetail({ product }: { product: PublicProduct }) {
  const t = useTranslations("Storefront.product");
  const format = useFormatter();
  const formatPrice = (cents: number) =>
    format.number(toMajorUnits(cents), currencyFormat(product.currency));

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
    selectionFor(product.variants.find((variant) => variant.stockQuantity > 0) ?? product.variants[0])
  );

  const [activeImage, setActiveImage] = useState(0);

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
        variant.stockQuantity > 0 &&
        variant.optionValues.some((optionValue) => optionValue.id === valueId)
    );
  }

  function selectValue(optionIndex: number, valueId: string) {
    setSelection((prev) => {
      const next = prev.map((chosen, i) => (i === optionIndex ? valueId : chosen));
      if (isInStock(findVariant(product.variants, next))) return next;

      // The new combination isn't buyable, so adopt the other options from
      // the first in-stock variant carrying the value just picked — choosing
      // Rose slides Size to Large instead of landing on sold-out Rose/Small.
      const repair = product.variants.find(
        (variant) =>
          variant.stockQuantity > 0 &&
          variant.optionValues.some((optionValue) => optionValue.id === valueId)
      );

      return repair ? selectionFor(repair) : next;
    });
  }

  const images = product.images;
  const isUnavailable = selectedVariant === undefined;
  const isSoldOut = selectedVariant !== undefined && selectedVariant.stockQuantity === 0;

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
            {selectedVariant
              ? formatPrice(selectedVariant.priceCents)
              : priceRange.min === priceRange.max
                ? formatPrice(priceRange.min)
                : `${formatPrice(priceRange.min)}–${formatPrice(priceRange.max)}`}
          </p>
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
            selectedVariant.stockQuantity <= 5 && (
              <Chip>
                <Chip.Label>{t("lowStock", { count: selectedVariant.stockQuantity })}</Chip.Label>
              </Chip>
            )
          )}

          <Button
            className="self-start"
            isDisabled={isUnavailable || isSoldOut}
            onPress={() => {
              // TODO: wire to the cart once it has a real backend — the
              // header popover is still running on mock data.
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
