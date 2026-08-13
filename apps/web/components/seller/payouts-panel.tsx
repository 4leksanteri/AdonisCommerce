"use client";

import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Button, Chip, Spinner } from "@heroui/react";
import { openPayoutDashboardAction, startPayoutOnboardingAction } from "@/lib/seller/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { PayoutDetails } from "@/lib/payments/types";

const STATUS_COLOR = {
  connected: "success",
  not_connected: "warning",
  restricted: "danger",
} as const;

export function PayoutsPanel({ details }: { details: PayoutDetails }) {
  const t = useTranslations("SellerPanel.payouts");
  const tPayout = useTranslations("SellerPanel.payout");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const format = useFormatter();
  const locale = useLocale();

  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const isConnected = details.payoutStatus === "connected";

  /**
   * The reason a seller can't be paid yet is different in each case, and
   * "payouts restricted" on its own tells them nothing about what to do.
   */
  const explanation = !details.hasAccount
    ? t("explainNotStarted")
    : isConnected
      ? t("explainConnected")
      : // Checked before `disabledReason`, which a half-finished account
        // always carries — Stripe has asked for everything and been given
        // nothing, which is not the same as a problem to fix.
        !details.detailsSubmitted
        ? t("explainIncomplete")
        : details.pendingVerification
          ? t("explainReviewing")
          : details.disabledReason
            ? t("explainActionNeeded")
            : t("explainIncomplete");

  async function go(
    action: () => Promise<{ url?: string; errors?: Parameters<typeof translateApiErrors>[0] }>
  ) {
    setErrorMessages([]);
    setIsPending(true);

    const result = await action();

    if (result.errors) {
      setIsPending(false);
      setErrorMessages(
        translateApiErrors(result.errors, {
          apiMessage: (code) => tApiMessages(code as Parameters<typeof tApiMessages>[0]),
          validationRule: (key) => tValidation(`rules.${key}` as Parameters<typeof tValidation>[0]),
        })
      );
      return;
    }

    // A full navigation, not a new tab: Stripe's onboarding is a flow the
    // seller works through and is then returned from, and popup blockers eat
    // windows opened after an await anyway.
    window.location.href = result.url!;
  }

  return (
    <div className="flex flex-col gap-6">
      {errorMessages.length > 0 && (
        <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <Chip color={STATUS_COLOR[details.payoutStatus]}>
            <Chip.Label>{tPayout(details.payoutStatus)}</Chip.Label>
          </Chip>
          <span className="text-xs text-muted">
            {t("commission", {
              rate: format.number(details.platformFeeBps / 10_000, {
                style: "percent",
                maximumFractionDigits: 2,
              }),
            })}
          </span>
        </div>

        <p className="text-sm text-muted">{explanation}</p>

        <div className="flex flex-wrap gap-2">
          <Button
            isPending={isPending}
            onPress={() =>
              go(
                isConnected ? openPayoutDashboardAction : () => startPayoutOnboardingAction(locale)
              )
            }
          >
            {({ isPending: pending }) => (
              <>
                {pending && <Spinner color="current" size="sm" />}
                {isConnected ? t("manage") : details.hasAccount ? t("continue") : t("connect")}
              </>
            )}
          </Button>

          {/* Already onboarded sellers still need a way back into the hosted
              forms — a new bank account, an expired ID document. */}
          {isConnected && (
            <Button
              variant="outline"
              isDisabled={isPending}
              onPress={() => go(() => startPayoutOnboardingAction(locale))}
            >
              {t("updateDetails")}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted">{t("stripeHint")}</p>
    </div>
  );
}
