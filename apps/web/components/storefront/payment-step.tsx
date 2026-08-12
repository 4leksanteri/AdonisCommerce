"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Spinner } from "@heroui/react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementLocale } from "@stripe/stripe-js";
import type { Payment } from "@/lib/payments/types";

/**
 * Loaded once for the lifetime of the tab. `loadStripe` injects a script tag,
 * so calling it per render would add one on every keystroke.
 *
 * This is the publishable key: it is meant to be in the browser and can only
 * create payment methods, never read the account or move money.
 */
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/**
 * The page follows the OS colour scheme, so the Stripe iframe has to as well
 * — a white card form dropped into a dark page reads as a broken embed.
 *
 * `matchMedia` is an external store, so it is read as one. The server has no
 * opinion on the visitor's theme and answers light; the real value arrives on
 * hydration, before Elements mounts.
 */
const DARK_SCHEME = "(prefers-color-scheme: dark)";

function subscribeToColorScheme(onChange: () => void) {
  const query = window.matchMedia(DARK_SCHEME);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersDark() {
  return useSyncExternalStore(
    subscribeToColorScheme,
    () => window.matchMedia(DARK_SCHEME).matches,
    () => false
  );
}

export function PaymentStep({
  payment,
  returnUrl,
  onPaid,
}: {
  payment: Payment;
  /** Where card flows that leave the page (3-D Secure, bank apps) come back to. */
  returnUrl: string;
  onPaid: () => void;
}) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const prefersDark = usePrefersDark();

  const options = useMemo(
    () => ({
      clientSecret: payment.clientSecret ?? undefined,
      locale: locale as StripeElementLocale,
      appearance: { theme: prefersDark ? ("night" as const) : ("stripe" as const) },
    }),
    [payment.clientSecret, locale, prefersDark]
  );

  if (!stripePromise || !payment.clientSecret) {
    return (
      <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
        {t("paymentUnavailable")}
      </div>
    );
  }

  return (
    // Keyed on the payment: a basket spanning two currencies pays twice, and
    // Elements cannot be handed a second client secret after it has mounted.
    <Elements key={payment.id} stripe={stripePromise} options={options}>
      <PaymentForm returnUrl={returnUrl} onPaid={onPaid} />
    </Elements>
  );
}

function PaymentForm({ returnUrl, onPaid }: { returnUrl: string; onPaid: () => void }) {
  const t = useTranslations("Checkout");
  const stripe = useStripe();
  const elements = useElements();

  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setErrorMessage(null);
    setIsPending(true);

    /**
     * `if_required` keeps an ordinary card payment on this page; only methods
     * that genuinely need to leave — 3-D Secure, bank redirects — use
     * `return_url`.
     */
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    setIsPending(false);

    if (error) {
      // Stripe's own copy is already localized and says far more about a
      // decline than anything we could write.
      setErrorMessage(error.message ?? t("paymentFailed"));
      return;
    }

    /**
     * `processing` counts as done here. Some methods settle asynchronously,
     * and the order only becomes `paid` when Stripe's webhook confirms it —
     * the browser's word was never what decided that.
     */
    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onPaid();
      return;
    }

    setErrorMessage(t("paymentFailed"));
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {errorMessage && (
        <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessage}
        </div>
      )}

      <PaymentElement />

      <Button type="submit" isPending={isPending} isDisabled={!stripe || !elements} fullWidth>
        {({ isPending: pending }) => (
          <>
            {pending && <Spinner color="current" size="sm" />}
            {t("payNow")}
          </>
        )}
      </Button>
    </form>
  );
}
