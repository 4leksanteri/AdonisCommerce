"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Label, Modal, Spinner, TextField, toast } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import {
  acceptOrderAction,
  cancelOrderAction,
  shipOrderAction,
} from "@/lib/seller/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { SellerOrder } from "@/lib/orders/types";
import type { ApiErrorItem } from "@/lib/api";

export function OrderActions({ order }: { order: SellerOrder }) {
  const t = useTranslations("SellerPanel.orders");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isShipOpen, setIsShipOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [reason, setReason] = useState("");

  async function run(
    action: () => Promise<{ order?: SellerOrder; errors?: ApiErrorItem[] }>,
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

    setIsShipOpen(false);
    setIsCancelOpen(false);
    toast.success(successMessage);
    // The server component holds the order, so the new status and the actions
    // that go with it come from a refetch rather than local state.
    router.refresh();
  }

  const { canAccept, canShip, canCancel } = order.actions;
  if (!canAccept && !canShip && !canCancel) return null;

  /**
   * One action, two meanings. Before dispatch it calls the order off; on a
   * disputed order it is the seller settling the problem themselves rather
   * than waiting for us to arbitrate — same refund, and the copy has to say
   * which one is happening.
   */
  const settling = order.status === "disputed";

  return (
    <div className="flex flex-col gap-3">
      {errorMessages.length > 0 && (
        <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canAccept && (
          <Button
            isPending={isPending}
            onPress={() => run(() => acceptOrderAction(order.id), t("accepted"))}
          >
            {({ isPending: pending }) => (
              <>
                {pending && <Spinner color="current" size="sm" />}
                {t("accept")}
              </>
            )}
          </Button>
        )}

        {canShip && (
          <Button isDisabled={isPending} onPress={() => setIsShipOpen(true)}>
            {t("markShipped")}
          </Button>
        )}

        {canCancel && (
          <Button variant="outline" isDisabled={isPending} onPress={() => setIsCancelOpen(true)}>
            {settling ? t("refundBuyer") : t("cancel")}
          </Button>
        )}
      </div>

      <Modal.Backdrop isOpen={isShipOpen} onOpenChange={setIsShipOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("shipHeading")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <p className="text-sm text-muted">{t("shipHint")}</p>
              <TextField isDisabled={isPending} value={trackingNumber} onChange={setTrackingNumber}>
                <Label>{t("trackingLabel")}</Label>
                <Input className="border border-border" placeholder={t("trackingPlaceholder")} />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline" isDisabled={isPending} onPress={() => setIsShipOpen(false)}>
                {t("back")}
              </Button>
              <Button
                isPending={isPending}
                onPress={() => run(() => shipOrderAction(order.id, trackingNumber), t("shipped"))}
              >
                {({ isPending: pending }) => (
                  <>
                    {pending && <Spinner color="current" size="sm" />}
                    {t("confirmShipped")}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{settling ? t("refundHeading") : t("cancelHeading")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              {/* Says plainly that this moves money — cancelling and refunding
                  are the same button, and nobody should discover that after. */}
              <p className="text-sm text-muted">
                {settling ? t("refundHint") : t("cancelHint")}
              </p>
              <TextField isDisabled={isPending} value={reason} onChange={setReason}>
                <Label>{t("reasonLabel")}</Label>
                <Input className="border border-border" placeholder={t("reasonPlaceholder")} />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="outline"
                isDisabled={isPending}
                onPress={() => setIsCancelOpen(false)}
              >
                {t("back")}
              </Button>
              <Button
                isPending={isPending}
                onPress={() =>
                  run(
                    () => cancelOrderAction(order.id, reason),
                    settling ? t("refundedBuyer") : t("cancelled")
                  )
                }
              >
                {({ isPending: pending }) => (
                  <>
                    {pending && <Spinner color="current" size="sm" />}
                    {settling ? t("confirmRefund") : t("confirmCancel")}
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
