"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ShopAvatar } from "@/components/storefront/shop-avatar";
import { ContactShop } from "@/components/messages/contact-shop";
import { Stars } from "@/components/storefront/stars";
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
import { convertCents, currencyFormat, toMajorUnits, type ExchangeRates } from "@/lib/format";
import { useCart } from "@/lib/cart/context";
import { rateFor, shippingCentsFor } from "@/lib/storefront/shipping";
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

/** At or below this, the count is worth showing as a nudge rather than data. */
const LOW_STOCK_THRESHOLD = 5;

/**
 * Pills rather than HeroUI's default segmented look. A product's options are
 * a handful of independent choices — Natural, Indigo — not a toolbar, and the
 * attached-segment treatment implies they are modes of one control.
 */
const OPTION_PILL = [
  "rounded-full border-[1.5px] border-field-border bg-surface px-4.5 text-[13.5px] font-semibold text-muted-strong",
  "hover:bg-row-hover",
  "data-[selected=true]:border-accent data-[selected=true]:bg-accent-tint data-[selected=true]:text-accent-soft-strong",
].join(" ");

/**
 * How to sign a review: a monogram, a name, or both.
 *
 * The API never publishes more than "Ale K.", and a reviewer whose display
 * name is a single letter would otherwise get that letter printed twice —
 * once in the mark, once beside it. Where the mark already says everything
 * the name would, the name goes. An erased account has no monogram at all,
 * because a "?" avatar next to "Someone" is two ways of saying nothing.
 */
function reviewerMark(author: string | null, anonymous: string) {
  const name = author?.trim();
  if (!name) return { initial: null, name: anonymous };

  return { initial: name.slice(0, 1).toUpperCase(), name: name.length > 1 ? name : null };
}

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
  const tReviews = useTranslations("Reviews");
  /** Locale-formatted, so Finnish reads 3,0 rather than 3.0. */
  const ratingText = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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
  const isSoldOut = selectedVariant !== undefined && !isAvailable(selectedVariant, tracksInventory);

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

  /**
   * The per-extra-item rate, or null when there isn't a distinct one. A
   * seller who charges the same for the second item as the first has already
   * said everything through the total, and repeating it as "· 5,90 € each
   * additional" reads as a surcharge that isn't there.
   */
  const rate = rateFor(product.shippingRates, shipToCountry);
  const additionalItemCents =
    rate && rate.additionalItemCents !== rate.firstItemCents ? rate.additionalItemCents : null;

  /** The remaining count, only when it is low enough to be worth saying. */
  const lowStock =
    selectedVariant && tracksInventory && selectedVariant.stockQuantity <= LOW_STOCK_THRESHOLD
      ? selectedVariant.stockQuantity
      : null;

  return (
    // The photo column is given the wider share. A square image next to a
    // column of short lines wants slightly more room than the text does, and
    // an even split leaves the picture looking cropped by the layout.
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-12">
      {/* `min-w-0` is load-bearing: a grid item defaults to `min-width: auto`
          and so refuses to shrink below its content, which would let the
          scrolling thumbnail strip widen the whole page instead of scrolling
          inside it. */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="aspect-square overflow-hidden rounded-[14px] border border-border bg-selected">
          {images[activeImage] && (
            <Image
              src={images[activeImage].url}
              alt={product.title}
              width={800}
              height={800}
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* A single scrolling row rather than a wrapping grid. Stacked on a
            phone, wrapped thumbnails sit between the photo and the price and
            push the buy button off the screen entirely. */}
        {images.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={t("viewImage", { number: index + 1 })}
                aria-current={index === activeImage ? "true" : undefined}
                onClick={() => setActiveImage(index)}
                className={`size-16 shrink-0 overflow-hidden rounded-[9px] ${
                  index === activeImage
                    ? "border-[1.5px] border-accent"
                    : "border border-border opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.url}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/*
        Spaced by margins on each block rather than one `gap`. The rhythm here
        isn't even: shop → title → rating → price is one tightening group that
        reads as a single heading, and the sections below it are further
        apart. A uniform gap flattens that into an undifferentiated list.
      */}
      <div className="flex min-w-0 flex-col">
        <Link
          href={{ pathname: "/shop/[shopSlug]", params: { shopSlug: product.shop.slug } }}
          className="flex w-fit items-center gap-2 text-[13px] font-medium text-muted-strong no-underline hover:text-foreground"
        >
          <ShopAvatar name={product.shop.name} url={product.shop.avatarUrl} size="xs" />
          {product.shop.name}
        </Link>

        <h1 className="mt-3.5 text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-foreground">
          {product.title}
        </h1>

        {product.rating.average !== null && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
            <Stars
              value={product.rating.average}
              label={tReviews("ratingLabel", {
                rating: ratingText(product.rating.average),
                count: product.rating.count,
              })}
            />
            <span>
              {ratingText(product.rating.average)}
              {" · "}
              {/* The count is the link, not the score — someone clicking here
                  wants to read the reviews, and they are further down the
                  same page. */}
              <a href="#reviews" className="text-accent hover:text-accent-soft-strong">
                {tReviews("heading", { count: product.rating.count })}
              </a>
            </span>
          </div>
        )}

        <p className="mt-4 text-[26px] font-bold tracking-[-0.02em] text-foreground">
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
          <p className="mt-1.5 text-[13px] text-muted">
            {t("approximateFrom", {
              price: selectedVariant
                ? formatIn(selectedVariant.priceCents, native)
                : formatIn(priceRange.min, native),
            })}
          </p>
        )}

        {product.options.map((option, optionIndex) => (
          <div key={option.id} className="mt-5.5">
            <p className="mb-2 text-[13px] font-semibold text-foreground">{option.name}</p>
            <ToggleButtonGroup
              isDetached
              className="flex-wrap gap-2"
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
                <ToggleButton
                  key={value.id}
                  id={value.id}
                  isDisabled={!isValueOffered(value.id)}
                  className={OPTION_PILL}
                >
                  {value.value}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
        ))}

        {showQuantity && (
          <NumberField
            className="mt-4.5 items-start gap-2"
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
            {/* Sized in fixed pixels rather than by content: the box must not
                change width between 1 and 10, or the button below it steps
                sideways as you count up. */}
            <NumberField.Group className="h-9.5 grid-cols-[38px_40px_38px] rounded-[9px] border-field-border bg-surface shadow-none">
              {/* The dividers either side of the number are the buttons' own
                  borders — recoloured, not added to. Giving the input its own
                  `border-x` puts a second line flush against each of these
                  and the hairline comes out 2px. */}
              <NumberField.DecrementButton className="border-e-chrome-border text-muted-strong hover:bg-selected" />
              <NumberField.Input className="min-w-0 px-0 text-center font-semibold" />
              <NumberField.IncrementButton className="border-s-chrome-border text-muted-strong hover:bg-selected" />
            </NumberField.Group>
          </NumberField>
        )}

        {/* Boxed, because the quote is only true for the destination named
            directly above it. Loose on the page the two read as unrelated
            facts and the price looks unconditional. */}
        <div className="mt-5.5 flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] text-muted">{t("shipTo")}</span>
            {/* Sized down against the card it sits in — at the default height
                the picker outweighs the quote it qualifies. Only the *start*
                padding is set: HeroUI reserves the end padding for the
                chevron, and a plain `px-` takes that space back and drops the
                arrow on top of the country name. */}
            <ShipToSelect triggerClassName="min-h-8 rounded-lg border-field-border bg-field ps-2.5 py-1.5 text-[13.5px] shadow-none" />
          </div>

          <p className="text-[13.5px] text-foreground">
            {isFreeShipping ? (
              t("shippingFree")
            ) : !shipping.deliverable ? (
              t("shippingUnavailable")
            ) : (
              <>
                {t.rich("shippingCost", {
                  cost: formatPrice(shipping.cents),
                  amount: (chunks) => <span className="font-bold">{chunks}</span>,
                })}
                {/* Only worth saying when a second one costs less than the
                    first — otherwise the total above already tells the whole
                    story. */}
                {additionalItemCents !== null && (
                  <span className="text-muted-soft">
                    {" · "}
                    {t("shippingAdditional", { cost: formatPrice(additionalItemCents) })}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {(isUnavailable || isSoldOut || (tracksInventory && lowStock !== null)) && (
          <div className="mt-4">
            {isUnavailable ? (
              <Chip color="danger">
                <Chip.Label>{t("combinationUnavailable")}</Chip.Label>
              </Chip>
            ) : isSoldOut ? (
              <Chip color="danger">
                <Chip.Label>{t("soldOut")}</Chip.Label>
              </Chip>
            ) : (
              <Chip>
                <Chip.Label>{t("lowStock", { count: lowStock! })}</Chip.Label>
              </Chip>
            )}
          </div>
        )}

        <div className="mt-4.5 flex flex-wrap items-center gap-2.5">
          <Button
            // Height rather than padding: HeroUI's button sets a fixed
            // `height`, so vertical padding alone just overflows the box.
            className="h-11 rounded-full px-8 text-[14.5px] font-semibold"
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

          {/* The question that decides a commission — "can you make this in
              blue?" — sits beside the buy button rather than under the shop
              name: it is the other thing you might do with this product, and
              a shopper who can't quite commit is looking here, not upwards. */}
          <ContactShop
            shopSlug={product.shop.slug}
            shopName={product.shop.name}
            className="h-11 rounded-full border-field-border bg-surface px-6 text-[14.5px] font-semibold text-muted-strong hover:bg-selected"
          />
        </div>

        {product.category && (
          <div className="mt-6.5 flex gap-2.5 border-t border-chrome-border pt-4 text-[13.5px]">
            <span className="text-muted">{t("categoryLabel")}</span>
            <Link
              href={{
                pathname: "/category/[categorySlug]",
                params: { categorySlug: product.category.slug },
              }}
              className="text-accent no-underline hover:text-accent-soft-strong hover:underline"
            >
              {product.category.name}
            </Link>
          </div>
        )}

        {product.description && (
          <div className="mt-5 border-t border-chrome-border pt-5">
            <h2 className="text-[15px] font-bold text-foreground">{t("descriptionHeading")}</h2>
            <p className="mt-2 text-sm leading-[1.6] whitespace-pre-line text-foreground-soft">
              {product.description}
            </p>
          </div>
        )}

        {/* `scroll-mt` keeps the heading clear of the sticky header when the
            rating's link jumps here. */}
        <div id="reviews" className="mt-5 scroll-mt-20 border-t border-chrome-border pt-5">
          <h2 className="text-[15px] font-bold text-foreground">
            {tReviews("heading", { count: product.rating.count })}
          </h2>

          {product.reviews.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">{tReviews("none")}</p>
          ) : (
            <div className="mt-3 flex flex-col gap-4">
              {product.reviews.map((review) => {
                const reviewer = reviewerMark(review.author, tReviews("anonymous"));

                return (
                  <div key={review.id} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px]">
                      <Stars
                        value={review.rating}
                        label={tReviews("stars", { count: review.rating })}
                      />
                      <span className="flex items-center gap-1.5">
                        {reviewer.initial && (
                          <span
                            aria-hidden
                            className="flex size-5.5 items-center justify-center rounded-full bg-selected text-[10px] font-bold text-muted-strong"
                          >
                            {reviewer.initial}
                          </span>
                        )}
                        {reviewer.name && (
                          <span className="font-semibold text-foreground">{reviewer.name}</span>
                        )}
                      </span>
                      <span className="text-muted-soft">
                        {format.dateTime(new Date(review.createdAt), { dateStyle: "short" })}
                      </span>
                    </div>
                    {review.body && (
                      <p className="text-[13.5px] leading-[1.55] whitespace-pre-line text-foreground-soft">
                        {review.body}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
