"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import {
  confirmReceiptAction,
  reportProblemAction,
  withdrawProblemAction,
} from "@/lib/orders/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { DisputeReason, Order } from "@/lib/orders/types";
import type { ApiErrorItem } from "@/lib/api";

const REASONS: DisputeReason[] = ["not_received", "damaged", "not_as_described", "other"];

export function BuyerOrderActions({ order }: { order: Order }) {
  const t = useTranslations("Order.actions");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isProblemOpen, setIsProblemOpen] = useState(false);
  const [reason, setReason] = useState<DisputeReason>("not_received");
  const [detail, setDetail] = useState("");

  async function run(
    action: () => Promise<{ order?: Order; errors?: ApiErrorItem[] }>,
    successMessage: string
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

    setIsProblemOpen(false);
    toast.success(successMessage);
    router.refresh();
  }

  const { canConfirmReceipt, canReportProblem, canWithdrawProblem } = order.actions;
  if (!canConfirmReceipt && !canReportProblem && !canWithdrawProblem) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      {errorMessages.length > 0 && (
        <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <p className="text-sm text-muted">{canWithdrawProblem ? t("withdrawPrompt") : t("prompt")}</p>

      <div className="flex flex-wrap gap-2">
        {canConfirmReceipt && (
          <Button
            isPending={isPending}
            onPress={() => run(() => confirmReceiptAction(order.reference), t("confirmed"))}
          >
            {({ isPending: pending }) => (
              <>
                {pending && <Spinner color="current" size="sm" />}
                {t("confirmReceipt")}
              </>
            )}
          </Button>
        )}

        {canReportProblem && (
          <Button variant="outline" isDisabled={isPending} onPress={() => setIsProblemOpen(true)}>
            {t("reportProblem")}
          </Button>
        )}

        {canWithdrawProblem && (
          <Button
            isPending={isPending}
            onPress={() => run(() => withdrawProblemAction(order.reference), t("withdrawn"))}
          >
            {({ isPending: pending }) => (
              <>
                {pending && <Spinner color="current" size="sm" />}
                {t("withdrawProblem")}
              </>
            )}
          </Button>
        )}
      </div>

      <Modal.Backdrop isOpen={isProblemOpen} onOpenChange={setIsProblemOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("problemHeading")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              {/* Says what actually happens next, so nobody expects an instant
                  refund and nobody reaches for a chargeback instead. */}
              <p className="text-sm text-muted">{t("problemHint")}</p>

              <Select
                aria-label={t("reasonLabel")}
                isDisabled={isPending}
                selectedKey={reason}
                onSelectionChange={(key) => setReason(String(key) as DisputeReason)}
              >
                <Label>{t("reasonLabel")}</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {REASONS.map((value) => (
                      <ListBox.Item key={value} id={value} textValue={t(`reason.${value}`)}>
                        {t(`reason.${value}`)}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <TextField isDisabled={isPending} value={detail} onChange={setDetail}>
                <Label>{t("detailLabel")}</Label>
                <Input placeholder={t("detailPlaceholder")} />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline"
                isDisabled={isPending}
                onPress={() => setIsProblemOpen(false)}
              >
                {t("back")}
              </Button>
              <Button
                isPending={isPending}
                onPress={() =>
                  run(() => reportProblemAction(order.reference, reason, detail), t("problemSent"))
                }
              >
                {({ isPending: pending }) => (
                  <>
                    {pending && <Spinner color="current" size="sm" />}
                    {t("submitProblem")}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
