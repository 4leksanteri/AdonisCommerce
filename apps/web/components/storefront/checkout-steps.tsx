import { useTranslations } from "next-intl";

/**
 * The three stops of a checkout: address, payment, done.
 *
 * Shared between the checkout form and the order page rather than living in
 * the form, because the third step *cannot* happen in the form. Stripe
 * confirms with `redirect: "if_required"`: a plain card stays put, but
 * Bancontact, EPS and any 3-D Secure challenge leave the site and return to
 * the order page. Those buyers never re-render the form, so a "done" panel
 * inside it would appear or not depending on how someone chose to pay. The
 * one place every payment lands is the order it created.
 */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  const t = useTranslations("Checkout");
  const labels = [t("stepShipping"), t("stepPayment"), t("stepDone")];

  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label={t("stepsLabel")}>
      {labels.map((label, index) => {
        const isCurrent = index === current;
        const isDone = index < current;

        return (
          <li
            key={label}
            className="flex items-center gap-2"
            aria-current={isCurrent ? "step" : undefined}
          >
            {/* Filled where you are, outlined where you have been, grey where
                you have not. Without the middle state a finished step looks
                identical to one you never reached. */}
            <span
              aria-hidden
              className={`flex size-5.5 items-center justify-center rounded-full border-[1.5px] text-[11.5px] font-bold ${
                isCurrent
                  ? "border-accent bg-accent text-accent-foreground"
                  : isDone
                    ? "border-accent text-accent"
                    : "border-border-strong text-muted-soft"
              }`}
            >
              {index + 1}
            </span>
            <span
              className={
                isCurrent
                  ? "text-[13px] font-bold text-foreground"
                  : isDone
                    ? "text-[13px] font-medium text-muted-strong"
                    : "text-[13px] font-medium text-muted-soft"
              }
            >
              {label}
            </span>
            {index < labels.length - 1 && (
              <span aria-hidden className="mx-0.5 inline-block h-[1.5px] w-7 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
