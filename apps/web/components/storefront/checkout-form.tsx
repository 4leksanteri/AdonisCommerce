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
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from "@heroui/react";
import { getPathname, Link, useRouter } from "@/i18n/navigation";
import { PaymentStep } from "@/components/storefront/payment-step";
import { ShipToSelect } from "@/components/storefront/ship-to-select";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { convertCents, currencyFormat, toMajorUnits } from "@/lib/format";
import {
  forgotPasswordAction,
  loginAction,
  logoutAction,
  registerAction,
} from "@/lib/auth/actions";
import { placeOrderAction } from "@/lib/orders/actions";
import { useStorefrontPreferences } from "@/lib/storefront/preferences-context";
import { shippingCentsFor } from "@/lib/storefront/shipping";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { CartLine } from "@/lib/cart/types";
import type { Order } from "@/lib/orders/types";
import type { Payment } from "@/lib/payments/types";

/**
 * How a signed-out buyer gets an account. There is no guest option: an order
 * belongs to a user in the database, and every part of what happens after
 * checkout — tracking it, messaging the shop, opening a dispute, leaving a
 * review — is reached from an account.
 */
type AccountMode = "login" | "register";

const CARD = "rounded-[14px] border border-border bg-surface";
const FIELD = "rounded-lg";

function groupByShop(lines: CartLine[]) {
  const shops = new Map<string, { name: string; slug: string; lines: CartLine[] }>();

  for (const line of lines) {
    const shop = shops.get(line.shopSlug) ?? {
      name: line.shopName,
      slug: line.shopSlug,
      lines: [],
    };
    shop.lines.push(line);
    shops.set(line.shopSlug, shop);
  }

  return [...shops.values()];
}

/**
 * Optional is spelled out; required is left to HeroUI, which appends its own
 * `*` from the field's `isRequired`. Adding one here as well prints two.
 */
function FieldLabel({ children, optional }: { children: ReactNode; optional?: string }) {
  return (
    <Label className="text-[13px] font-semibold text-foreground">
      {children}
      {optional && <span className="font-medium text-muted-soft"> {optional}</span>}
    </Label>
  );
}

/** The padlock that appears wherever the page is claiming to be safe. */
function LockIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      className={`${className} shrink-0`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** The orders exist and are holding stock; all that's left is paying. */
type PlacedCheckout = { orders: Order[]; payments: Payment[] };

export function CheckoutForm() {
  const t = useTranslations("Checkout");
  const tAuth = useTranslations("AuthModal");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();

  const { user, setUser } = useAuth();
  const { items, lines, isLoading, clear } = useCart();
  const { displayCurrency, rates, shipToCountry } = useStorefrontPreferences();

  const [name, setName] = useState(user?.fullName ?? "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [accountMode, setAccountMode] = useState<AccountMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authErrors, setAuthErrors] = useState<string[]>([]);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isAuthPending, setIsAuthPending] = useState(false);

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

  function translate(errors: Parameters<typeof translateApiErrors>[0]) {
    return translateApiErrors(errors, {
      apiMessage: (code) => tApiMessages(code as Parameters<typeof tApiMessages>[0]),
      validationRule: (key) => tValidation(`rules.${key}` as Parameters<typeof tValidation>[0]),
    });
  }

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

  /**
   * Logging in is its own act with its own button, but registering is folded
   * into placing the order — so a signed-out buyer who has chosen to log in
   * has something left to do above before this form means anything.
   */
  const needsLogin = !user && accountMode === "login";

  function finish(orders: Order[]) {
    // The cart has become paid-for orders; keeping it would show items the
    // buyer already owns and let a second submit reserve the stock again.
    clear();
    toast.success(t("placed"));
    router.push({
      pathname: "/account/orders/[reference]",
      params: { reference: orders[0].reference },
    });
  }

  async function handleLogin() {
    setAuthErrors([]);
    setAuthNotice(null);
    setIsAuthPending(true);
    const result = await loginAction(authEmail, authPassword);
    setIsAuthPending(false);

    if (result.errors) {
      setAuthErrors(translate(result.errors));
      return;
    }

    setUser(result.user);
    setAuthPassword("");
    // Their own name, but only if they hadn't already started typing one —
    // signing in shouldn't wipe out what someone was in the middle of.
    setName((current) => current || (result.user.fullName ?? ""));
  }

  /**
   * Handled here rather than linked away. `/reset-password` is the page the
   * emailed link lands on and it needs a token, so sending someone there from
   * checkout drops them on "this link is invalid" — and they lose the basket
   * they were halfway through paying for.
   */
  async function handleForgotPassword() {
    setAuthErrors([]);
    setAuthNotice(null);
    setIsAuthPending(true);
    const result = await forgotPasswordAction(authEmail, locale);
    setIsAuthPending(false);

    if (result.errors) {
      setAuthErrors(translate(result.errors));
      return;
    }

    setAuthNotice(tApiMessages(result.code as Parameters<typeof tApiMessages>[0]));
  }

  /** Enter inside the account card logs in; it must never submit the order. */
  function loginOnEnter(event: React.KeyboardEvent) {
    if (event.key !== "Enter" || accountMode !== "login") return;
    event.preventDefault();
    if (authEmail && authPassword && !isAuthPending) void handleLogin();
  }

  async function handleLogout() {
    setUser(null);
    setAccountMode("login");
    await logoutAction();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (needsLogin) return;

    setErrorMessages([]);
    setAuthErrors([]);
    setIsPending(true);

    // Registering happens here rather than behind its own button, so the
    // buyer presses one thing. It has to land first: placing the order is
    // authenticated, and the session is what registering establishes.
    if (!user) {
      const registered = await registerAction(name, authEmail, authPassword, authPassword, locale);

      if (registered.errors) {
        setAuthErrors(translate(registered.errors));
        setIsPending(false);
        return;
      }
      setUser(registered.user);
    }

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
      setErrorMessages(translate(result.errors));
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

  /** 0 while the address is being filled in, 1 while paying. */
  const currentStep = checkout ? 1 : 0;
  const steps = [t("stepShipping"), t("stepPayment"), t("stepDone")];

  function header(showSteps: boolean) {
    return (
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent no-underline hover:text-accent-soft-strong hover:underline"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            aria-hidden
          >
            <polyline points="15,5 8,12 15,19" />
          </svg>
          {t("backToShopping")}
        </Link>

        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.02em] text-foreground">
          {t("heading")}
        </h1>

        {showSteps && (
          <ol className="mt-3 flex flex-wrap items-center gap-2" aria-label={t("stepsLabel")}>
            {steps.map((label, index) => {
              const isCurrent = index === currentStep;

              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`flex size-5.5 items-center justify-center rounded-full border-[1.5px] text-[11.5px] font-bold ${
                      isCurrent
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border-strong text-muted-soft"
                    }`}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={
                      isCurrent
                        ? "text-[13px] font-bold text-foreground"
                        : "text-[13px] font-medium text-muted-soft"
                    }
                  >
                    {label}
                  </span>
                  {index < steps.length - 1 && (
                    <span aria-hidden className="mx-0.5 inline-block h-[1.5px] w-7 bg-border" />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    );
  }

  if (isLoading && lines.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header(false)}
        <div className="grid place-items-center p-10">
          <Spinner />
        </div>
      </div>
    );
  }

  if (lines.length === 0 && !checkout) {
    return (
      <div className="flex flex-col gap-6">
        {header(false)}
        <div className={`${CARD} p-8 text-center text-sm text-muted`}>{t("empty")}</div>
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
      <div className="flex flex-col gap-4 md:sticky md:top-6">
        <div className={`${CARD} flex flex-col gap-3.5 p-5`}>
          <h2 className="text-[15px] font-bold text-foreground">{t("summaryHeading")}</h2>

          {shops.map((shop) => {
            const shipping = shippingForShop(shop.lines);
            const currency = shop.lines[0].currency;
            const subtotal = shop.lines.reduce(
              (sum, line) => sum + line.priceCents * quantityOf(line.variantId),
              0
            );

            return (
              <div key={shop.slug} className="flex flex-col gap-2.5">
                <p className="text-[11.5px] font-semibold tracking-[0.05em] text-muted-soft uppercase">
                  {shop.name}
                </p>

                {shop.lines.map((line) => (
                  <div key={line.variantId} className="flex items-center gap-3">
                    <div className="size-11 shrink-0 overflow-hidden rounded-[9px] border border-border bg-selected">
                      {line.imageUrl && (
                        <Image
                          src={line.imageUrl}
                          alt=""
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-foreground">
                        {line.productTitle}
                      </p>
                      {/* Variant and count on one line: they are both answers
                          to "which one, and how many", and stacking them
                          makes a two-item basket taller than the form. */}
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {[
                          ...line.optionValues,
                          t("quantityTimes", {
                            quantity: quantityOf(line.variantId),
                            price: money(line.priceCents, currency),
                          }),
                        ].join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13.5px] font-semibold text-foreground">
                      {money(line.priceCents * quantityOf(line.variantId), currency)}
                    </span>
                  </div>
                ))}

                <div className="flex flex-col gap-1.5 border-t border-chrome-border pt-3 text-[13.5px]">
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
                  <div className="mt-1 flex justify-between border-t border-chrome-border pt-2 text-[15px] font-bold text-foreground">
                    <span>{t("shopTotal")}</span>
                    <span>{money(subtotal + shipping.cents, currency)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {hasUndeliverable && <p className="text-[13px] text-danger">{t("undeliverableHint")}</p>}

          {/* Each seller is paid separately, so a multi-shop basket becomes
              several orders — worth saying before the button, not after. */}
          {shops.length > 1 && (
            <p className="text-xs text-muted">{t("splitHint", { count: shops.length })}</p>
          )}

          {action}
        </div>

        <p className="flex items-start gap-2 px-1 text-[12.5px] text-muted">
          <LockIcon className="mt-0.5 size-3.5 text-secure" />
          {t("secureNote")}
        </p>
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
              pathname: "/account/orders/[reference]",
              params: { reference: checkout.orders[0].reference },
            },
            locale,
          });

    return (
      <div className="flex flex-col gap-6">
        {header(true)}

        <div className="grid items-start gap-7 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className={`${CARD} flex min-w-0 flex-col gap-4 p-6`}>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">{t("paymentHeading")}</h2>
              <p className="mt-1 text-[13px] text-muted">
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

            <p className="text-xs text-muted-soft">{t("reservationHint")}</p>
          </div>

          {summaryPanel(null)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header(true)}

      <Form
        className="grid items-start gap-7 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        onSubmit={handleSubmit}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <div className={`${CARD} flex flex-col gap-4 p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold text-foreground">{t("accountHeading")}</h2>

              {!user && (
                <ToggleButtonGroup
                  isDetached
                  aria-label={t("accountModeLabel")}
                  className="gap-1 rounded-[10px] border border-field-border bg-selected p-[3px]"
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={[accountMode]}
                  onSelectionChange={(keys) => {
                    const [first] = [...keys];
                    if (first === undefined) return;
                    setAccountMode(first as AccountMode);
                    setAuthErrors([]);
                  }}
                >
                  {(["login", "register"] as const).map((mode) => (
                    <ToggleButton
                      key={mode}
                      id={mode}
                      isDisabled={isPending || isAuthPending}
                      className="h-7 rounded-lg bg-transparent px-3 text-[12.5px] font-semibold text-muted data-[selected=true]:bg-surface data-[selected=true]:text-foreground data-[selected=true]:shadow-[0_1px_2px_rgba(60,45,20,0.10)]"
                    >
                      {mode === "login" ? t("loginTab") : t("registerTab")}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}
            </div>

            {authErrors.length > 0 && (
              <div className="rounded-lg bg-danger-soft p-3 text-[13px] text-danger-soft-foreground">
                {authErrors.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}

            {authNotice && (
              <div className="rounded-lg bg-success-soft p-3 text-[13px] text-success-soft-foreground">
                {authNotice}
              </div>
            )}

            {user ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-selected text-xs font-bold text-muted-strong">
                  {user.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-foreground">
                    {user.fullName ?? user.email}
                  </p>
                  <p className="truncate text-xs text-muted-soft">{user.email}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  isDisabled={isPending}
                  onPress={handleLogout}
                  className="h-8 rounded-full border-field-border bg-surface px-3.5 text-[12.5px] font-semibold text-muted-strong hover:bg-selected"
                >
                  {t("switchAccount")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    isRequired
                    isDisabled={isPending || isAuthPending}
                    type="email"
                    value={authEmail}
                    onChange={setAuthEmail}
                  >
                    <FieldLabel>{tAuth("emailLabel")}</FieldLabel>
                    <Input
                      className={FIELD}
                      placeholder={tAuth("emailPlaceholder")}
                      onKeyDown={loginOnEnter}
                    />
                  </TextField>

                  <TextField
                    isRequired
                    isDisabled={isPending || isAuthPending}
                    type="password"
                    minLength={accountMode === "register" ? 8 : undefined}
                    value={authPassword}
                    onChange={setAuthPassword}
                  >
                    <FieldLabel>{tAuth("passwordLabel")}</FieldLabel>
                    <Input className={FIELD} onKeyDown={loginOnEnter} />
                  </TextField>
                </div>

                {accountMode === "login" && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                      type="button"
                      isPending={isAuthPending}
                      isDisabled={isPending || !authEmail || !authPassword}
                      onPress={handleLogin}
                      className="h-9 rounded-[9px] px-5 text-[13px] font-semibold"
                    >
                      {({ isPending: pending }) => (
                        <>
                          {pending && <Spinner color="current" size="sm" />}
                          {t("loginTab")}
                        </>
                      )}
                    </Button>
                    <button
                      type="button"
                      disabled={isPending || isAuthPending || !authEmail}
                      onClick={handleForgotPassword}
                      className="text-[12.5px] text-accent hover:text-accent-soft-strong hover:underline disabled:pointer-events-none disabled:opacity-50"
                    >
                      {tAuth("forgotPasswordLink")}
                    </button>
                  </div>
                )}

                <p className="text-xs text-muted-soft">
                  {accountMode === "login" ? t("loginHint") : t("registerHint")}
                </p>
              </div>
            )}
          </div>

          <div className={`${CARD} flex flex-col gap-4 p-6`}>
            <h2 className="text-[15px] font-bold text-foreground">{t("addressHeading")}</h2>

            {errorMessages.length > 0 && (
              <div className="rounded-lg bg-danger-soft p-3 text-[13px] text-danger-soft-foreground">
                {errorMessages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}

            <TextField isRequired isDisabled={isPending} value={name} onChange={setName}>
              <FieldLabel>{t("nameLabel")}</FieldLabel>
              <Input className={FIELD} />
            </TextField>

            <TextField isRequired isDisabled={isPending} value={line1} onChange={setLine1}>
              <FieldLabel>{t("line1Label")}</FieldLabel>
              <Input className={FIELD} placeholder={t("line1Placeholder")} />
            </TextField>

            <TextField isDisabled={isPending} value={line2} onChange={setLine2}>
              <FieldLabel optional={t("optional")}>{t("line2Label")}</FieldLabel>
              <Input className={FIELD} />
            </TextField>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <TextField
                isRequired
                isDisabled={isPending}
                value={postalCode}
                onChange={setPostalCode}
              >
                <FieldLabel>{t("postalCodeLabel")}</FieldLabel>
                <Input className={FIELD} />
              </TextField>
              <TextField isRequired isDisabled={isPending} value={city} onChange={setCity}>
                <FieldLabel>{t("cityLabel")}</FieldLabel>
                <Input className={FIELD} />
              </TextField>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t("countryLabel")}</FieldLabel>
              {/* Only the start padding: HeroUI keeps the end reserved for the
                  chevron, and a `px-` utility takes that space back. */}
              <ShipToSelect triggerClassName="w-full rounded-lg border-field-border bg-field ps-3 py-2.5 text-sm shadow-none" />
              <p className="text-xs text-muted-soft">{t("countryHint")}</p>
            </div>
          </div>
        </div>

        {summaryPanel(
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              isPending={isPending}
              isDisabled={hasUndeliverable || needsLogin}
              fullWidth
              className="h-12 rounded-full text-[14.5px] font-semibold"
            >
              {({ isPending: pending }) => (
                <>
                  {pending && <Spinner color="current" size="sm" />}
                  {t("continueToPayment")}
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-soft">
              {needsLogin ? t("signInRequired") : t("paymentNextStep")}
            </p>
          </div>
        )}
      </Form>
    </div>
  );
}
