"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Input,
  Label,
  Spinner,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { updateReviewAction, writeReviewAction } from "@/lib/storefront/review-actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { Review } from "@/lib/storefront/types";
import type { ApiErrorItem } from "@/lib/api";

const RATINGS = [1, 2, 3, 4, 5];

/**
 * Written per order line, so buying two different things in one order means
 * two of these. Editable afterwards — a first impression a week in is often
 * worth revising, and without it people write a second review they can't.
 */
export function ReviewForm({
  orderItemId,
  productTitle,
  existing,
}: {
  orderItemId: string;
  productTitle: string;
  existing: Review | null;
}) {
  const t = useTranslations("Reviews");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const router = useRouter();

  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [isOpen, setIsOpen] = useState(existing === null);
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function submit() {
    if (rating === 0) {
      setErrorMessages([t("ratingRequired")]);
      return;
    }

    setErrorMessages([]);
    setIsPending(true);

    const result: { review?: Review; errors?: ApiErrorItem[] } = existing
      ? await updateReviewAction(existing.id, rating, body)
      : await writeReviewAction(orderItemId, rating, body);

    setIsPending(false);

    if (result.errors) {
      setErrorMessages(
        translateApiErrors(result.errors, {
          apiMessage: (code) => tApiMessages(code as Parameters<typeof tApiMessages>[0]),
          validationRule: (key) => tValidation(`rules.${key}` as Parameters<typeof tValidation>[0]),
        })
      );
      return;
    }

    setIsOpen(false);
    toast.success(existing ? t("updated") : t("thanks"));
    router.refresh();
  }

  if (!isOpen) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">{t("yourRating", { rating: existing?.rating ?? 0 })}</span>
        <Button variant="outline" onPress={() => setIsOpen(true)}>
          {t("edit")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {errorMessages.length > 0 && (
        <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <ToggleButtonGroup
        aria-label={t("ratingLabelFor", { product: productTitle })}
        selectionMode="single"
        selectedKeys={rating > 0 ? [String(rating)] : []}
        onSelectionChange={(keys) => {
          const [first] = [...keys];
          setRating(first ? Number(first) : 0);
        }}
        isDisabled={isPending}
      >
        {RATINGS.map((value) => (
          <ToggleButton key={value} id={String(value)} aria-label={t("stars", { count: value })}>
            {value}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <TextField isDisabled={isPending} value={body} onChange={setBody}>
        <Label>{t("bodyLabel")}</Label>
        <Input placeholder={t("bodyPlaceholder")} />
      </TextField>

      <div className="flex gap-2">
        <Button isPending={isPending} onPress={submit}>
          {({ isPending: pending }) => (
            <>
              {pending && <Spinner color="current" size="sm" />}
              {existing ? t("save") : t("submit")}
            </>
          )}
        </Button>
        {existing && (
          <Button variant="outline" isDisabled={isPending} onPress={() => setIsOpen(false)}>
            {t("cancel")}
          </Button>
        )}
      </div>
    </div>
  );
}
