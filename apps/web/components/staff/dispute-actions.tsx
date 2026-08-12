"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Label, Spinner, TextField, toast } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { refundDisputeAction, releaseDisputeAction } from "@/lib/staff/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { StaffDispute } from "@/lib/staff/types";
import type { ApiErrorItem } from "@/lib/api";

/**
 * The two outcomes, side by side and equally weighted. Deliberately not a
 * primary/secondary pair: which one is right depends entirely on the case,
 * and styling one as the obvious choice would nudge someone into deciding
 * where a stranger's money goes on autopilot.
 */
export function DisputeActions({ dispute }: { dispute: StaffDispute }) {
  const t = useTranslations("Staff");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const router = useRouter();

  const [note, setNote] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function run(
    action: () => Promise<{ dispute?: StaffDispute; errors?: ApiErrorItem[] }>,
    message: string
  ) {
    setErrorMessages([]);
    setIsPending(true);

    const result = await action();
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

    toast.success(message);
    router.refresh();
  }

  if (dispute.status !== "open") return null;

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border p-4">
      <div>
        <h2 className="font-medium text-foreground">{t("decideHeading")}</h2>
        <p className="mt-1 text-sm text-muted">
          {dispute.order.isPaidOut ? t("decideHintPaidOut") : t("decideHint")}
        </p>
      </div>

      {errorMessages.length > 0 && (
        <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <TextField isDisabled={isPending} value={note} onChange={setNote}>
        <Label>{t("noteLabel")}</Label>
        <Input className="border border-border" placeholder={t("notePlaceholder")} />
      </TextField>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          isPending={isPending}
          onPress={() => run(() => refundDisputeAction(dispute.id, note), t("refunded"))}
        >
          {({ isPending: pending }) => (
            <>
              {pending && <Spinner color="current" size="sm" />}
              {t("refundBuyer")}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          isPending={isPending}
          onPress={() => run(() => releaseDisputeAction(dispute.id, note), t("released"))}
        >
          {({ isPending: pending }) => (
            <>
              {pending && <Spinner color="current" size="sm" />}
              {t("releaseSeller")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
