"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  NumberField,
  Spinner,
  Table,
  Tag,
  TagGroup,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import {
  createDraftProductAction,
  createProductAction,
  updateProductAction,
  uploadProductImagesAction,
  type CreateProductInput,
} from "@/lib/seller/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { ApiErrorItem } from "@/lib/api";
import type { ProductImage } from "@/lib/seller/types";

type OptionDraft = { name: string; values: string[] };
type VariantDraft = { price: string; stockQuantity: string; sku: string };

const EMPTY_VARIANT: VariantDraft = { price: "", stockQuantity: "0", sku: "" };

function cartesianProduct(valuesLists: string[][]): string[][] {
  return valuesLists.reduce<string[][]>(
    (acc, values) => acc.flatMap((combo) => values.map((value) => [...combo, value])),
    [[]]
  );
}

export function ProductForm() {
  const router = useRouter();
  const t = useTranslations("SellerPanel.productForm");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [valueDrafts, setValueDrafts] = useState<string[]>([]);
  const [variantValues, setVariantValues] = useState<Map<string, VariantDraft>>(new Map());
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Lazily created the moment the seller picks their first image — gives
  // us a real id to attach images to before the rest of the form is done.
  // If never set, final submit does a plain one-shot create instead.
  const [productId, setProductId] = useState<number | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const validOptions = useMemo(
    () => options.filter((option) => option.name.trim().length > 0 && option.values.length > 0),
    [options]
  );

  const combinations = useMemo(
    () => cartesianProduct(validOptions.map((option) => option.values)),
    [validOptions]
  );

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
        i === index && !option.values.includes(value) ? { ...option, values: [...option.values, value] } : option
      )
    );
    setValueDrafts((prev) => prev.map((draft, i) => (i === index ? "" : draft)));
  }

  function removeOptionValue(index: number, value: string) {
    setOptions((prev) =>
      prev.map((option, i) => (i === index ? { ...option, values: option.values.filter((v) => v !== value) } : option))
    );
  }

  function updateVariant(key: string, field: keyof VariantDraft, value: string) {
    setVariantValues((prev) => {
      const next = new Map(prev);
      next.set(key, { ...(next.get(key) ?? EMPTY_VARIANT), [field]: value });
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    const payload: CreateProductInput = {
      title,
      description,
      options: validOptions,
      variants: combinations.map((combo) => {
        const key = JSON.stringify(combo);
        const draft = variantValues.get(key) ?? EMPTY_VARIANT;
        return {
          optionValues: combo,
          sku: draft.sku,
          price: Number(draft.price) || 0,
          stockQuantity: Number(draft.stockQuantity) || 0,
        };
      }),
    };

    setIsPending(true);
    const result = productId === null ? await createProductAction(payload) : await updateProductAction(productId, payload);
    setIsPending(false);

    if (result.errors) {
      showErrors(result.errors);
      return;
    }

    toast.success(t("createButton"));
    router.push("/seller/products");
  }

  return (
    <Form className="flex flex-col gap-8" onSubmit={handleSubmit}>
      {errorMessages.length > 0 && (
        <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
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
            <div key={image.id} className="h-24 w-24 overflow-hidden rounded-lg border border-border">
              <Image src={image.url} alt="" width={96} height={96} unoptimized className="h-full w-full object-cover" />
            </div>
          ))}

          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-center text-xs text-muted hover:text-foreground">
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
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium text-foreground">{t("optionsHeading")}</h2>
          <p className="text-sm text-muted">{t("optionsHint")}</p>
        </div>

        {options.map((option, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-lg border border-border p-4">
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
              <TagGroup
                aria-label={option.name || t("optionNameLabel")}
                onRemove={(keys) => {
                  for (const key of keys) removeOptionValue(index, String(key));
                }}
              >
                <TagGroup.List items={option.values.map((value) => ({ id: value }))}>
                  {(item) => (
                    <Tag id={item.id} textValue={item.id}>
                      {item.id}
                    </Tag>
                  )}
                </TagGroup.List>
              </TagGroup>
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

        <Button variant="outline" isDisabled={isPending} onPress={addOption} className="self-start">
          {t("addOption")}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-medium text-foreground">{t("variantsHeading")}</h2>

        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label={t("variantsHeading")}>
              <Table.Header>
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
                    <Table.Row key={key}>
                      {combo.map((value, i) => (
                        <Table.Cell key={i}>{value}</Table.Cell>
                      ))}
                      <Table.Cell>
                        <NumberField
                          aria-label={t("priceLabel")}
                          minValue={0}
                          step={0.01}
                          isDisabled={isPending}
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
                          isDisabled={isPending}
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
                          isDisabled={isPending}
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

      <Button type="submit" isPending={isPending} isDisabled={isUploadingImages} className="self-start">
        {({ isPending: pending }) => (
          <>
            {pending && <Spinner color="current" size="sm" />}
            {t("createButton")}
          </>
        )}
      </Button>
    </Form>
  );
}
