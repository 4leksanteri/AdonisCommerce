"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Button,
  Checkbox,
  CloseButton,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  NumberField,
  Spinner,
  Switch,
  ListBox,
  Select,
  Table,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import {
  createDraftProductAction,
  createProductAction,
  deleteProductImageAction,
  updateProductAction,
  uploadProductImagesAction,
  type CreateProductInput,
} from "@/lib/seller/actions";
import { toMajorUnits, toMinorUnits } from "@/lib/format";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { ApiErrorItem } from "@/lib/api";
import { MAX_IMAGES, type Category, type Product, type ProductImage } from "@/lib/seller/types";
import type { ShippingProfile } from "@/lib/seller/shipping-types";

/** `delta` is what this value adds to the base price when filling prices. */
type OptionValueDraft = { value: string; delta: string };
type OptionDraft = { name: string; values: OptionValueDraft[] };
type VariantDraft = { price: string; stockQuantity: string; sku: string; isExcluded: boolean };

const EMPTY_VARIANT: VariantDraft = { price: "", stockQuantity: "0", sku: "", isExcluded: false };

// Mirrors the caps in the API's product validator. The form stops the seller
// before the request does; the API stays the actual guard.
const MAX_OPTIONS = 3;
const MAX_VARIANTS = 200;

function cartesianProduct(valuesLists: string[][]): string[][] {
  return valuesLists.reduce<string[][]>(
    (acc, values) => acc.flatMap((combo) => values.map((value) => [...combo, value])),
    [[]]
  );
}

function optionValueNames(options: OptionDraft[]): string[][] {
  return options.map((option) => option.values.map((value) => value.value));
}

function toOptionDrafts(product?: Product): OptionDraft[] {
  return (product?.options ?? []).map((option) => ({
    name: option.name,
    values: option.values.map((value) => ({ value: value.value, delta: "" })),
  }));
}

/**
 * Rebuilds the variant grid's draft map from a saved product, keyed exactly
 * the way the grid keys it: a JSON array of option values in option order.
 * A variant's `optionValues` come back without that ordering attached, so
 * they're sorted by the option each one belongs to before the key is built.
 */
function toVariantDrafts(product: Product | undefined, options: OptionDraft[]): Map<string, VariantDraft> {
  const drafts = new Map<string, VariantDraft>();
  if (!product) return drafts;

  const optionIndexByValueId = new Map<string, number>();
  product.options.forEach((option, index) => {
    for (const value of option.values) optionIndexByValueId.set(value.id, index);
  });

  for (const variant of product.variants) {
    const combo = [...variant.optionValues]
      .sort((a, b) => (optionIndexByValueId.get(a.id) ?? 0) - (optionIndexByValueId.get(b.id) ?? 0))
      .map((value) => value.value);

    drafts.set(JSON.stringify(combo), {
      price: String(toMajorUnits(variant.priceCents)),
      stockQuantity: String(variant.stockQuantity),
      sku: variant.sku ?? "",
      isExcluded: false,
    });
  }

  // A combination the saved product has no variant for is one the seller
  // excluded last time. Without this it would silently reappear, ticked, on
  // the next edit — and get recreated on save.
  for (const combo of cartesianProduct(optionValueNames(options))) {
    const key = JSON.stringify(combo);
    if (!drafts.has(key)) drafts.set(key, { ...EMPTY_VARIANT, isExcluded: true });
  }

  return drafts;
}

const FREE_SHIPPING = "free";

export function ProductForm({
  product,
  shippingProfiles,
  categories,
}: {
  product?: Product;
  shippingProfiles: ShippingProfile[];
  categories: Category[];
}) {
  const router = useRouter();
  const t = useTranslations("SellerPanel.productForm");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");

  const isEditing = product !== undefined;

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [options, setOptions] = useState<OptionDraft[]>(() => toOptionDrafts(product));
  const [valueDrafts, setValueDrafts] = useState<string[]>(() =>
    (product?.options ?? []).map(() => "")
  );
  const [variantValues, setVariantValues] = useState<Map<string, VariantDraft>>(() =>
    toVariantDrafts(product, toOptionDrafts(product))
  );
  const [basePrice, setBasePrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [isListed, setIsListed] = useState(product?.status !== "archived");
  const [tracksInventory, setTracksInventory] = useState(product?.tracksInventory ?? true);
  // Preselect a profile for new products so free shipping is a choice rather
  // than an oversight; an existing product keeps whatever it was saved with.
  const [categoryId, setCategoryId] = useState<string | null>(product?.categoryId ?? null);
  const [shippingProfileId, setShippingProfileId] = useState<string>(
    product ? (product.shippingProfileId ?? FREE_SHIPPING) : (shippingProfiles[0]?.id ?? FREE_SHIPPING)
  );
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // When creating, this is lazily filled the moment the seller picks their
  // first image — it gives us a real id to attach images to before the rest
  // of the form is done. If still null at submit, we do a one-shot create.
  const [productId, setProductId] = useState<string | null>(product?.id ?? null);
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);

  const validOptions = useMemo(
    () => options.filter((option) => option.name.trim().length > 0 && option.values.length > 0),
    [options]
  );

  const combinations = useMemo(
    () => cartesianProduct(optionValueNames(validOptions)),
    [validOptions]
  );

  const includedCount = combinations.filter(
    (combo) => !variantValues.get(JSON.stringify(combo))?.isExcluded
  ).length;

  function showErrors(errors: ApiErrorItem[]) {
    setErrorMessages(
      translateApiErrors(errors, {
        apiMessage: (code) => tApiMessages(code as Parameters<typeof tApiMessages>[0]),
        validationRule: (key) => tValidation(`rules.${key}` as Parameters<typeof tValidation>[0]),
      })
    );
  }

  function addOption() {
    setOptions((prev) => [...prev, { name: "", values: [] }]);
    setValueDrafts((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setValueDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOptionName(index: number, name: string) {
    setOptions((prev) => prev.map((option, i) => (i === index ? { ...option, name } : option)));
  }

  function addOptionValue(index: number) {
    const value = valueDrafts[index]?.trim();
    if (!value) return;

    setOptions((prev) =>
      prev.map((option, i) =>
        i === index && !option.values.some((existing) => existing.value === value)
          ? { ...option, values: [...option.values, { value, delta: "" }] }
          : option
      )
    );
    setValueDrafts((prev) => prev.map((draft, i) => (i === index ? "" : draft)));
  }

  function removeOptionValue(index: number, value: string) {
    setOptions((prev) =>
      prev.map((option, i) =>
        i === index ? { ...option, values: option.values.filter((v) => v.value !== value) } : option
      )
    );
  }

  function updateValueDelta(optionIndex: number, value: string, delta: string) {
    setOptions((prev) =>
      prev.map((option, i) =>
        i === optionIndex
          ? {
              ...option,
              values: option.values.map((v) => (v.value === value ? { ...v, delta } : v)),
            }
          : option
      )
    );
  }

  function updateVariant<K extends keyof VariantDraft>(key: string, field: K, value: VariantDraft[K]) {
    setVariantValues((prev) => {
      const next = new Map(prev);
      next.set(key, { ...(next.get(key) ?? EMPTY_VARIANT), [field]: value });
      return next;
    });
  }

  /** Base price plus every selected value's adjustment, e.g. 1999 + 200 + 600. */
  function computedPrice(combo: string[]) {
    return combo.reduce((total, value, optionIndex) => {
      const delta = validOptions[optionIndex]?.values.find((v) => v.value === value)?.delta;
      return total + (Number(delta) || 0);
    }, Number(basePrice) || 0);
  }

  /**
   * Writes the computed price (and optionally one stock figure) across every
   * included row. Explicit rather than reactive so the seller can still hand-
   * tune individual rows afterwards without the form overwriting them.
   */
  function applyToAllVariants() {
    setVariantValues((prev) => {
      const next = new Map(prev);
      for (const combo of combinations) {
        const key = JSON.stringify(combo);
        const draft = next.get(key) ?? EMPTY_VARIANT;
        if (draft.isExcluded) continue;

        next.set(key, {
          ...draft,
          price: String(computedPrice(combo)),
          stockQuantity: bulkStock === "" ? draft.stockQuantity : bulkStock,
        });
      }
      return next;
    });
  }

  async function handleImagesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = "";

    setErrorMessages([]);
    setIsUploadingImages(true);

    let currentProductId = productId;
    if (currentProductId === null) {
      const draftResult = await createDraftProductAction();
      if (draftResult.errors) {
        setIsUploadingImages(false);
        showErrors(draftResult.errors);
        return;
      }
      currentProductId = draftResult.product.id;
      setProductId(currentProductId);
    }

    if (images.length + files.length > MAX_IMAGES) {
      setIsUploadingImages(false);
      setErrorMessages([t("imagesTooMany", { max: MAX_IMAGES })]);
      return;
    }

    const formData = new FormData();
    for (const file of Array.from(files)) formData.append("images", file);

    const uploadResult = await uploadProductImagesAction(currentProductId, formData);
    setIsUploadingImages(false);

    if (uploadResult.errors) {
      showErrors(uploadResult.errors);
      return;
    }

    setImages((prev) => [...prev, ...uploadResult.images]);
  }

  async function handleRemoveImage(imageId: string) {
    // Images only ever exist against a saved product (a draft one while
    // creating), so there is always an id to delete against here.
    if (productId === null) return;

    setErrorMessages([]);
    setRemovingImageId(imageId);
    const result = await deleteProductImageAction(productId, imageId);
    setRemovingImageId(null);

    if (result.errors) {
      showErrors(result.errors);
      return;
    }

    setImages((prev) => prev.filter((image) => image.id !== imageId));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    // The API requires it too; answering here saves a round trip and points
    // at the field rather than returning a validation code.
    if (!categoryId) {
      setErrorMessages([t("categoryRequired")]);
      return;
    }

    const payload: CreateProductInput = {
      title,
      description,
      // Left off when creating so the API publishes the product itself —
      // the listed/unlisted switch only exists once there's a product to hide.
      ...(isEditing && { status: isListed ? ("active" as const) : ("archived" as const) }),
      tracksInventory,
      shippingProfileId: shippingProfileId === FREE_SHIPPING ? null : shippingProfileId,
      categoryId,
      options: validOptions.map((option) => ({
        name: option.name,
        values: option.values.map((value) => value.value),
      })),
      // Excluded combinations are simply absent — the storefront already
      // handles a missing variant as "that combination isn't available".
      variants: combinations
        .map((combo) => ({ combo, draft: variantValues.get(JSON.stringify(combo)) ?? EMPTY_VARIANT }))
        .filter(({ draft }) => !draft.isExcluded)
        .map(({ combo, draft }) => ({
          optionValues: combo,
          sku: draft.sku,
          // The seller types major units; the API only ever sees minor ones.
          priceCents: toMinorUnits(Number(draft.price) || 0),
          stockQuantity: Number(draft.stockQuantity) || 0,
        })),
    };

    setIsPending(true);
    const result = productId === null ? await createProductAction(payload) : await updateProductAction(productId, payload);
    setIsPending(false);

    if (result.errors) {
      showErrors(result.errors);
      return;
    }

    toast.success(isEditing ? t("saveSuccess") : t("createSuccess"));
    router.push("/seller/products");
  }

  return (
    <Form className="flex flex-col gap-8" onSubmit={handleSubmit}>
      {errorMessages.length > 0 && (
        <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <TextField isRequired isDisabled={isPending} minLength={2} name="title" value={title} onChange={setTitle}>
          <Label>{t("titleLabel")}</Label>
          <Input placeholder={t("titlePlaceholder")} className="border border-border" />
          <FieldError />
        </TextField>

        <TextField isDisabled={isPending} name="description" value={description} onChange={setDescription}>
          <Label>{t("descriptionLabel")}</Label>
          <TextArea className="h-24 border border-border" placeholder={t("descriptionPlaceholder")} />
        </TextField>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium text-foreground">{t("imagesHeading")}</h2>
          <p className="text-sm text-muted">{t("imagesHint")}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative h-24 w-24 overflow-hidden rounded-card border border-border">
              <Image src={image.url} alt="" width={96} height={96} className="h-full w-full object-cover" />
              {removingImageId === image.id ? (
                <div className="absolute inset-0 grid place-items-center bg-background/60">
                  <Spinner size="sm" />
                </div>
              ) : (
                <CloseButton
                  aria-label={t("removeImage")}
                  isDisabled={isPending || removingImageId !== null}
                  onPress={() => handleRemoveImage(image.id)}
                  className="absolute top-1 right-1 size-6 bg-background/80"
                />
              )}
            </div>
          ))}

          {/* The API enforces the cap; hiding the picker just avoids offering
              an upload that is going to be refused. */}
          {images.length < MAX_IMAGES && (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-card border border-dashed border-border text-center text-xs text-muted hover:text-foreground">
              {isUploadingImages ? <Spinner size="sm" /> : <span>{t("addImage")}</span>}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                disabled={isPending || isUploadingImages}
                onChange={handleImagesSelected}
              />
            </label>
          )}
        </div>

        <p className="text-xs text-muted">
          {images.length >= MAX_IMAGES
            ? t("imagesFull", { max: MAX_IMAGES })
            : t("imagesRemaining", { count: MAX_IMAGES - images.length })}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium text-foreground">{t("optionsHeading")}</h2>
          <p className="text-sm text-muted">{t("optionsHint")}</p>
        </div>

        {options.map((option, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-card border border-border p-4">
            <div className="flex items-end gap-2">
              <TextField
                className="flex-1"
                isDisabled={isPending}
                value={option.name}
                onChange={(name) => updateOptionName(index, name)}
              >
                <Label>{t("optionNameLabel")}</Label>
                <Input placeholder={t("optionNamePlaceholder")} className="border border-border" />
              </TextField>
              <Button variant="outline" isDisabled={isPending} onPress={() => removeOption(index)}>
                {t("removeOption")}
              </Button>
            </div>

            {option.values.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="flex-1">{t("valueLabel")}</span>
                  <span className="w-24">{t("priceAdjustmentLabel")}</span>
                  <span className="size-7" aria-hidden />
                </div>

                {option.values.map((value) => (
                  <div key={value.value} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm text-foreground">{value.value}</span>
                    <NumberField
                      aria-label={t("priceAdjustmentFor", { value: value.value })}
                      step={0.01}
                      isDisabled={isPending}
                      value={value.delta === "" ? undefined : Number(value.delta)}
                      onChange={(delta) =>
                        updateValueDelta(index, value.value, Number.isNaN(delta) ? "" : String(delta))
                      }
                    >
                      <NumberField.Group>
                        <NumberField.Input className="w-24" placeholder="0.00" />
                      </NumberField.Group>
                    </NumberField>
                    <CloseButton
                      aria-label={t("removeValue", { value: value.value })}
                      isDisabled={isPending}
                      onPress={() => removeOptionValue(index, value.value)}
                      className="size-7"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <TextField
                className="flex-1"
                isDisabled={isPending}
                value={valueDrafts[index] ?? ""}
                onChange={(value) => setValueDrafts((prev) => prev.map((draft, i) => (i === index ? value : draft)))}
              >
                <Input
                  placeholder={t("valuePlaceholder")}
                  className="border border-border"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOptionValue(index);
                    }
                  }}
                />
              </TextField>
              <Button variant="outline" isDisabled={isPending} onPress={() => addOptionValue(index)}>
                {t("addValue")}
              </Button>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          isDisabled={isPending || options.length >= MAX_OPTIONS}
          onPress={addOption}
          className="self-start"
        >
          {t("addOption")}
        </Button>
        {options.length >= MAX_OPTIONS && (
          <p className="text-xs text-muted">{t("maxOptionsReached", { count: MAX_OPTIONS })}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium text-foreground">{t("variantsHeading")}</h2>
          <p className="text-sm text-muted">
            {t("variantSummary", { included: includedCount, total: combinations.length })}
          </p>
        </div>

        <Switch
          isSelected={tracksInventory}
          isDisabled={isPending}
          onChange={setTracksInventory}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label>{t("tracksInventoryLabel")}</Label>
          </Switch.Content>
          <Description>{t("tracksInventoryHint")}</Description>
        </Switch>

        {includedCount > MAX_VARIANTS && (
          <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
            {t("tooManyVariants", { count: MAX_VARIANTS })}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 rounded-card border border-border p-4">
          <NumberField
            minValue={0}
            step={0.01}
            isDisabled={isPending}
            value={basePrice === "" ? undefined : Number(basePrice)}
            onChange={(value) => setBasePrice(Number.isNaN(value) ? "" : String(value))}
          >
            <Label>{t("basePriceLabel")}</Label>
            <NumberField.Group>
              <NumberField.Input className="w-28" />
            </NumberField.Group>
          </NumberField>

          <NumberField
            minValue={0}
            step={1}
            isDisabled={isPending || !tracksInventory}
            value={bulkStock === "" ? undefined : Number(bulkStock)}
            onChange={(value) => setBulkStock(Number.isNaN(value) ? "" : String(value))}
          >
            <Label>{t("bulkStockLabel")}</Label>
            <NumberField.Group>
              <NumberField.Input className="w-24" />
            </NumberField.Group>
          </NumberField>

          <Button variant="outline" isDisabled={isPending} onPress={applyToAllVariants}>
            {t("applyToAll")}
          </Button>

          <p className="w-full text-xs text-muted">{t("applyToAllHint")}</p>
        </div>

        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label={t("variantsHeading")}>
              <Table.Header>
                <Table.Column>{t("includeLabel")}</Table.Column>
                {validOptions.map((option, index) => (
                  <Table.Column key={`option-${index}`} isRowHeader={index === 0}>
                    {option.name}
                  </Table.Column>
                ))}
                <Table.Column isRowHeader={validOptions.length === 0}>{t("priceLabel")}</Table.Column>
                <Table.Column>{t("stockLabel")}</Table.Column>
                <Table.Column>{t("skuLabel")}</Table.Column>
              </Table.Header>
              <Table.Body>
                {combinations.map((combo) => {
                  const key = JSON.stringify(combo);
                  const draft = variantValues.get(key) ?? EMPTY_VARIANT;

                  return (
                    <Table.Row key={key} className={draft.isExcluded ? "opacity-50" : undefined}>
                      <Table.Cell>
                        <Checkbox
                          aria-label={t("includeCombination", { combination: combo.join(" / ") })}
                          isSelected={!draft.isExcluded}
                          isDisabled={isPending}
                          onChange={(isSelected) => updateVariant(key, "isExcluded", !isSelected)}
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                      </Table.Cell>
                      {combo.map((value, i) => (
                        <Table.Cell key={i}>{value}</Table.Cell>
                      ))}
                      <Table.Cell>
                        <NumberField
                          aria-label={t("priceLabel")}
                          minValue={0}
                          step={0.01}
                          isDisabled={isPending || draft.isExcluded}
                          value={draft.price === "" ? undefined : Number(draft.price)}
                          onChange={(value) =>
                            updateVariant(key, "price", Number.isNaN(value) ? "" : String(value))
                          }
                        >
                          <NumberField.Group>
                            <NumberField.Input className="w-24" />
                          </NumberField.Group>
                        </NumberField>
                      </Table.Cell>
                      <Table.Cell>
                        <NumberField
                          aria-label={t("stockLabel")}
                          minValue={0}
                          step={1}
                          isDisabled={isPending || draft.isExcluded || !tracksInventory}
                          value={Number(draft.stockQuantity) || 0}
                          onChange={(value) =>
                            updateVariant(key, "stockQuantity", Number.isNaN(value) ? "0" : String(value))
                          }
                        >
                          <NumberField.Group>
                            <NumberField.Input className="w-20" />
                          </NumberField.Group>
                        </NumberField>
                      </Table.Cell>
                      <Table.Cell>
                        <TextField
                          aria-label={t("skuLabel")}
                          isDisabled={isPending || draft.isExcluded}
                          value={draft.sku}
                          onChange={(value) => updateVariant(key, "sku", value)}
                        >
                          <Input className="w-32 border border-border" />
                        </TextField>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      <Select
        isDisabled={isPending}
        isRequired
        placeholder={t("categoryPlaceholder")}
        selectedKey={categoryId}
        onSelectionChange={(key) => setCategoryId(String(key))}
        className="max-w-sm"
      >
        <Label>{t("categoryLabel")}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {categories.map((category) => (
              <ListBox.Item key={category.id} id={category.id} textValue={category.name}>
                {category.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <Select
        isDisabled={isPending}
        selectedKey={shippingProfileId}
        onSelectionChange={(key) => setShippingProfileId(String(key))}
        className="max-w-sm"
      >
        <Label>{t("shippingProfileLabel")}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {[
              <ListBox.Item key={FREE_SHIPPING} id={FREE_SHIPPING} textValue={t("shippingFree")}>
                {t("shippingFree")}
                <ListBox.ItemIndicator />
              </ListBox.Item>,
              ...shippingProfiles.map((profile) => (
                <ListBox.Item key={profile.id} id={profile.id} textValue={profile.name}>
                  {profile.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              )),
            ]}
          </ListBox>
        </Select.Popover>
        <Description>{t("shippingHint")}</Description>
      </Select>

      {isEditing && (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium text-foreground">{t("statusHeading")}</h2>
          <Switch isSelected={isListed} isDisabled={isPending} onChange={setIsListed}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label>{t("statusLabel")}</Label>
            </Switch.Content>
            <Description>{t("statusHint")}</Description>
          </Switch>
        </div>
      )}

      <Button
        type="submit"
        isPending={isPending}
        isDisabled={
          isUploadingImages ||
          removingImageId !== null ||
          includedCount === 0 ||
          includedCount > MAX_VARIANTS
        }
        className="self-start"
      >
        {({ isPending: pending }) => (
          <>
            {pending && <Spinner color="current" size="sm" />}
            {isEditing ? t("saveButton") : t("createButton")}
          </>
        )}
      </Button>
    </Form>
  );
}
