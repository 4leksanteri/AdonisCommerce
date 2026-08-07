"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  Button,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { getPathname, useRouter } from "@/i18n/navigation";
import { AuthModal } from "@/components/auth/modal";
import { PaymentStep } from "@/components/storefront/payment-step";
import { ShipToSelect } from "@/components/storefront/ship-to-select";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { convertCents, currencyFormat, toMajorUnits } from "@/lib/format";
import { placeOrderAction } from "@/lib/orders/actions";
import { useStorefrontPreferences } from "@/lib/storefront/preferences-context";
import { shippingCentsFor } from "@/lib/storefront/shipping";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { CartLine } from "@/lib/cart/types";
import type { Order } from "@/lib/orders/types";
import type { Payment } from "@/lib/payments/types";

function groupByShop(lines: CartLine[]) {
  const shops = new Map<string, { name: string; slug: string; lines: CartLine[] }>();

  for (const line of lines) {
    const shop = shops.get(line.shopSlug) ?? { name: line.shopName, slug: line.shopSlug, lines: [] };
    shop.lines.push(line);
    shops.set(line.shopSlug, shop);
  }

  return [...shops.values()];
}

/** The orders exist and are holding stock; all that's left is paying. */
type PlacedCheckout = { orders: Order[]; payments: Payment[] };

export function CheckoutForm() {
  const t = useTranslations("Checkout");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const { user } = useAuth();
  const { items, lines, isLoading, clear } = useCart();
  const { displayCurrency, rates, shipToCountry } = useStorefrontPreferences();

  const [name, setName] = useState(user?.fullName ?? "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [checkout, setCheckout] = useState<PlacedCheckout | null>(null);
  const [paymentIndex, setPaymentIndex] = useState(0);

  const quantityOf = (variantId: string) =>
    items.find((item) => item.variantId === variantId)?.quantity ?? 0;

  const shops = groupByShop(lines);

  const targetFor = (currency: string) =>
    displayCurrency && convertCents(100, currency, displayCurrency, rates) !== null
      ? displayCurrency
      : currency;

  const money = (cents: number, currency: string) => {
    const target = targetFor(currency);
    const amount = convertCents(cents, currency, target, rates) ?? cents;
    const formatted = format.number(toMajorUnits(amount), currencyFormat(target));
    return target === currency ? formatted : `≈ ${formatted}`;
  };

  /** Per seller, then per profile — items sharing a parcel are charged once. */
  function shippingForShop(shopLines: CartLine[]) {
    const byProfile = new Map<string, { rates: CartLine["shippingRates"]; quantity: number }>();

    for (const line of shopLines) {
      if (!line.shippingProfileId) continue;
      const entry = byProfile.get(line.shippingProfileId);
      byProfile.set(line.shippingProfileId, {
        rates: line.shippingRates,
        quantity: (entry?.quantity ?? 0) + quantityOf(line.variantId),
      });
    }

    let cents = 0;
    let deliverable = true;
    for (const { rates: profileRates, quantity } of byProfile.values()) {
      const quote = shippingCentsFor(profileRates, shipToCountry, quantity);
      if (!quote.deliverable) deliverable = false;
      cents += quote.cents;
    }

    return { cents, deliverable };
  }

  const hasUndeliverable = shops.some((shop) => !shippingForShop(shop.lines).deliverable);

  function finish(orders: Order[]) {
    // The cart has become paid-for orders; keeping it would show items the
    // buyer already owns and let a second submit reserve the stock again.
    clear();
    toast.success(t("placed"));
    router.push({
      pathname: "/orders/[reference]",
      params: { reference: orders[0].reference },
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessages([]);
    setIsPending(true);

    const result = await placeOrderAction(items, {
      name,
      line1,
      line2: line2 || undefined,
      city,
      postalCode,
      country: shipToCountry,
    });
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

    setPaymentIndex(0);
    setCheckout({ orders: result.orders, payments: result.payments });
  }

  function handlePaid() {
    if (!checkout) return;

    // A basket priced in two currencies is two charges — carry on to the next
    // one rather than declaring the order done.
    if (paymentIndex + 1 < checkout.payments.length) {
      setPaymentIndex(paymentIndex + 1);
      return;
    }

    finish(checkout.orders);
  }

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-border p-6">
        <p className="text-sm text-muted">{t("signInRequired")}</p>
        <AuthModal />
      </div>
    );
  }

  if (isLoading && lines.length === 0) {
    return (
      <div className="grid place-items-center p-10">
        <Spinner />
      </div>
    );
  }

  if (lines.length === 0 && !checkout) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-sm text-muted">
        {t("empty")}
      </div>
    );
  }

  /**
   * The same figures serve both steps — the buyer should still be able to see
   * what they're paying for while they're paying for it — so the panel is
   * built once and takes whatever action belongs beneath it.
   */
  function summaryPanel(action: ReactNode) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <h2 className="font-medium text-foreground">{t("summaryHeading")}</h2>

        {shops.map((shop) => {
          const shipping = shippingForShop(shop.lines);
          const currency = shop.lines[0].currency;
          const subtotal = shop.lines.reduce(
            (sum, line) => sum + line.priceCents * quantityOf(line.variantId),
            0
          );

          return (
            <div key={shop.slug} className="flex flex-col gap-3 border-b border-border pb-4 last:border-b-0">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">{shop.name}</p>

              {shop.lines.map((line) => (
                <div key={line.variantId} className="flex items-start gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                    {line.imageUrl && (
                      <Image
                        src={line.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{line.productTitle}</p>
                    {line.optionValues.length > 0 && (
                      <p className="truncate text-xs text-muted">{line.optionValues.join(" / ")}</p>
                    )}
                    <p className="text-xs text-muted">
                      {t("quantityTimes", {
                        quantity: quantityOf(line.variantId),
                        price: money(line.priceCents, currency),
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-foreground">
                    {money(line.priceCents * quantityOf(line.variantId), currency)}
                  </span>
                </div>
              ))}

              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between text-muted">
                  <span>{t("subtotal")}</span>
                  <span>{money(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{t("shipping")}</span>
                  <span>
                    {!shipping.deliverable
                      ? t("undeliverable")
                      : shipping.cents === 0
                        ? t("shippingFree")
                        : money(shipping.cents, currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-medium text-foreground">
                  <span>{t("shopTotal")}</span>
                  <span>{money(subtotal + shipping.cents, currency)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {hasUndeliverable && <p className="text-sm text-danger">{t("undeliverableHint")}</p>}

        {/* Each seller is paid separately, so a multi-shop basket becomes
            several orders — worth saying before the button, not after. */}
        {shops.length > 1 && <p className="text-xs text-muted">{t("splitHint", { count: shops.length })}</p>}

        {action}
      </div>
    );
  }

  if (checkout) {
    const payment = checkout.payments[paymentIndex];

    /**
     * Absolute, because Stripe hands it to the bank — a relative path would
     * be resolved against the bank's own domain. Built through the localized
     * router so a Finnish buyer comes back to `/fi/tilaukset/...`.
     */
    const returnUrl =
      typeof window === "undefined"
        ? ""
        : window.location.origin +
          getPathname({
            href: {
              pathname: "/orders/[reference]",
              params: { reference: checkout.orders[0].reference },
            },
            locale,
          });

    return (
      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-medium text-foreground">{t("paymentHeading")}</h2>
            <p className="mt-1 text-sm text-muted">
              {checkout.payments.length > 1
                ? t("paymentStepOf", {
                    step: paymentIndex + 1,
                    total: checkout.payments.length,
                    amount: money(payment.amountCents, payment.currency),
                  })
                : t("paymentAmount", { amount: money(payment.amountCents, payment.currency) })}
            </p>
          </div>

          <PaymentStep payment={payment} returnUrl={returnUrl} onPaid={handlePaid} />

          <p className="text-xs text-muted">{t("reservationHint")}</p>
        </div>

        {summaryPanel(null)}
      </div>
    );
  }

  return (
    <Form className="grid gap-8 md:grid-cols-2 md:items-start" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <h2 className="font-medium text-foreground">{t("addressHeading")}</h2>

        {errorMessages.length > 0 && (
          <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
            {errorMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <TextField isRequired isDisabled={isPending} value={name} onChange={setName}>
          <Label>{t("nameLabel")}</Label>
          <Input className="border border-border" />
        </TextField>

        <TextField isRequired isDisabled={isPending} value={line1} onChange={setLine1}>
          <Label>{t("line1Label")}</Label>
          <Input className="border border-border" />
        </TextField>

        <TextField isDisabled={isPending} value={line2} onChange={setLine2}>
          <Label>{t("line2Label")}</Label>
          <Input className="border border-border" />
        </TextField>

        <div className="flex gap-3">
          <TextField
            className="flex-1"
            isRequired
            isDisabled={isPending}
            value={postalCode}
            onChange={setPostalCode}
          >
            <Label>{t("postalCodeLabel")}</Label>
            <Input className="border border-border" />
          </TextField>
          <TextField className="flex-[2]" isRequired isDisabled={isPending} value={city} onChange={setCity}>
            <Label>{t("cityLabel")}</Label>
            <Input className="border border-border" />
          </TextField>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted">{t("countryLabel")}</span>
          <ShipToSelect />
          <p className="text-xs text-muted">{t("countryHint")}</p>
        </div>
      </div>

      {summaryPanel(
        <Button type="submit" isPending={isPending} isDisabled={hasUndeliverable} fullWidth>
          {({ isPending: pending }) => (
            <>
              {pending && <Spinner color="current" size="sm" />}
              {t("continueToPayment")}
            </>
          )}
        </Button>
      )}
    </Form>
  );
}
