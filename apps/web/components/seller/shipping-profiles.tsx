"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Button,
  CloseButton,
  Input,
  Label,
  NumberField,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits, toMinorUnits } from "@/lib/format";
import {
  deleteShippingProfileAction,
  saveShippingProfileAction,
} from "@/lib/seller/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import { ANY_DESTINATION, type ShippingProfile } from "@/lib/seller/shipping-types";
import type { ApiErrorItem } from "@/lib/api";

type RateDraft = { destination: string; first: string; additional: string };

/**
 * A new profile starts with a catch-all so it can ship somewhere immediately —
 * a profile with no matching rate refuses the order rather than shipping free.
 */
const NEW_PROFILE_RATES: RateDraft[] = [{ destination: ANY_DESTINATION, first: "", additional: "" }];

function toDrafts(profile: ShippingProfile): RateDraft[] {
  return profile.rates.map((rate) => ({
    destination: rate.destination,
    first: String(toMajorUnits(rate.firstItemCents)),
    additional: String(toMajorUnits(rate.additionalItemCents)),
  }));
}

export function ShippingProfiles({
  profiles,
  currency,
  sellerCountry,
}: {
  profiles: ShippingProfile[];
  currency: string;
  sellerCountry: string;
}) {
  const t = useTranslations("SellerPanel.shipping");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const format = useFormatter();
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [rates, setRates] = useState<RateDraft[]>(NEW_PROFILE_RATES);
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const money = (cents: number) => format.number(toMajorUnits(cents), currencyFormat(currency));

  function showErrors(errors: ApiErrorItem[]) {
    setErrorMessages(
      translateApiErrors(errors, {
        apiMessage: (code) => tApiMessages(code as Parameters<typeof tApiMessages>[0]),
        validationRule: (key) => tValidation(`rules.${key}` as Parameters<typeof tValidation>[0]),
      })
    );
  }

  function startCreate() {
    setEditingId(null);
    setIsCreating(true);
    setName("");
    setRates(NEW_PROFILE_RATES);
    setErrorMessages([]);
  }

  function startEdit(profile: ShippingProfile) {
    setIsCreating(false);
    setEditingId(profile.id);
    setName(profile.name);
    setRates(toDrafts(profile));
    setErrorMessages([]);
  }

  function cancel() {
    setIsCreating(false);
    setEditingId(null);
    setErrorMessages([]);
  }

  function updateRate(index: number, patch: Partial<RateDraft>) {
    setRates((prev) => prev.map((rate, i) => (i === index ? { ...rate, ...patch } : rate)));
  }

  async function save() {
    setErrorMessages([]);
    setIsPending(true);

    const result = await saveShippingProfileAction(
      editingId,
      name,
      rates.map((rate) => ({
        destination: rate.destination.trim() || ANY_DESTINATION,
        firstItemCents: toMinorUnits(Number(rate.first) || 0),
        additionalItemCents: toMinorUnits(Number(rate.additional) || 0),
      }))
    );
    setIsPending(false);

    if (result.errors) {
      showErrors(result.errors);
      return;
    }

    toast.success(t("saved"));
    cancel();
    router.refresh();
  }

  async function remove(profile: ShippingProfile) {
    setIsPending(true);
    const result = await deleteShippingProfileAction(profile.id);
    setIsPending(false);

    if (result.errors) {
      showErrors(result.errors);
      return;
    }

    toast.success(t("deleted"));
    router.refresh();
  }

  const isEditing = isCreating || editingId !== null;

  return (
    <div className="flex flex-col gap-6">
      {errorMessages.length > 0 && (
        <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      {profiles.length === 0 && !isEditing ? (
        <div className="rounded-card border border-border p-8 text-center text-sm text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-card border border-border">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-foreground">{profile.name}</p>
                <ul className="mt-1 flex flex-col gap-0.5 text-sm text-muted">
                  {profile.rates.map((rate) => (
                    <li key={rate.id}>
                      {rate.destination === ANY_DESTINATION
                        ? t("everywhereElse")
                        : rate.destination === sellerCountry
                          ? t("domestic", { country: rate.destination })
                          : rate.destination}
                      {" · "}
                      {rate.additionalItemCents === 0
                        ? t("rateSummaryFlat", { first: money(rate.firstItemCents) })
                        : t("rateSummary", {
                            first: money(rate.firstItemCents),
                            additional: money(rate.additionalItemCents),
                          })}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" isDisabled={isPending} onPress={() => startEdit(profile)}>
                  {t("edit")}
                </Button>
                <Button variant="outline" isDisabled={isPending} onPress={() => remove(profile)}>
                  {t("delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-4 rounded-card border border-border p-4">
          <TextField isDisabled={isPending} value={name} onChange={setName}>
            <Label>{t("nameLabel")}</Label>
            <Input placeholder={t("namePlaceholder")} className="border border-border" />
          </TextField>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="w-28">{t("destinationLabel")}</span>
              <span className="w-28">{t("firstItemLabel")}</span>
              <span className="w-28">{t("additionalItemLabel")}</span>
              <span className="size-7" aria-hidden />
            </div>

            {rates.map((rate, index) => (
              <div key={index} className="flex items-end gap-2">
                <TextField
                  className="w-28"
                  aria-label={t("destinationLabel")}
                  isDisabled={isPending}
                  value={rate.destination}
                  onChange={(value) => updateRate(index, { destination: value.toUpperCase() })}
                >
                  <Input placeholder={ANY_DESTINATION} className="border border-border" />
                </TextField>

                <NumberField
                  aria-label={t("firstItemLabel")}
                  minValue={0}
                  step={0.01}
                  isDisabled={isPending}
                  value={rate.first === "" ? undefined : Number(rate.first)}
                  onChange={(value) =>
                    updateRate(index, { first: Number.isNaN(value) ? "" : String(value) })
                  }
                >
                  <NumberField.Group className="w-28">
                    <NumberField.Input />
                  </NumberField.Group>
                </NumberField>

                <NumberField
                  aria-label={t("additionalItemLabel")}
                  minValue={0}
                  step={0.01}
                  isDisabled={isPending}
                  value={rate.additional === "" ? undefined : Number(rate.additional)}
                  onChange={(value) =>
                    updateRate(index, { additional: Number.isNaN(value) ? "" : String(value) })
                  }
                >
                  <NumberField.Group className="w-28">
                    <NumberField.Input />
                  </NumberField.Group>
                </NumberField>

                <CloseButton
                  aria-label={t("removeRate")}
                  isDisabled={isPending || rates.length === 1}
                  onPress={() => setRates((prev) => prev.filter((_, i) => i !== index))}
                  className="size-7"
                />
              </div>
            ))}

            <Button
              variant="outline"
              className="self-start"
              isDisabled={isPending}
              onPress={() =>
                setRates((prev) => [...prev, { destination: "", first: "", additional: "" }])
              }
            >
              {t("addRate")}
            </Button>
            <p className="text-xs text-muted">{t("destinationHint")}</p>
            <p className="text-xs text-muted">{t("flatRateHint")}</p>
          </div>

          <div className="flex gap-2">
            <Button isPending={isPending} onPress={save}>
              {({ isPending: pending }) => (
                <>
                  {pending && <Spinner color="current" size="sm" />}
                  {t("save")}
                </>
              )}
            </Button>
            <Button variant="outline" isDisabled={isPending} onPress={cancel}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="self-start" onPress={startCreate}>
          {t("newProfile")}
        </Button>
      )}
    </div>
  );
}
