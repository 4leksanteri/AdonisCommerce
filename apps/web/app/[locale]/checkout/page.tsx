import { Container } from "@/components/ui/container";
import { CheckoutForm } from "@/components/storefront/checkout-form";

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * Deliberately thin. The heading, the back link and the step indicator all
 * belong to the form's own state — which step you are on is the same fact as
 * whether the orders have been placed — so they are rendered there rather
 * than split across a server shell that would have to be told.
 *
 * The exception is the query string. A buyer who paid by a method that leaves
 * the site — Bancontact, EPS, a 3-D Secure card — comes back here from their
 * bank with a fresh page load and none of the form's state, so what happened
 * has to be read off the URL and handed in. Read server-side rather than with
 * `useSearchParams` so the form stays a plain component with no suspense
 * boundary around it.
 */
export default async function CheckoutPage(props: PageProps<"/[locale]/checkout">) {
  const searchParams = await props.searchParams;

  const paid = first(searchParams.paid);
  const status = first(searchParams.redirect_status);

  return (
    <main className="flex-1 pt-9 pb-16">
      <Container width="checkout">
        <CheckoutForm
          // `processing` counts as paid for the same reason it does in the
          // payment step: some methods settle asynchronously and the webhook,
          // not the browser, is what finally marks the order.
          paidReferences={paid && status !== "failed" ? paid.split(",").filter(Boolean) : []}
          redirectFailed={status === "failed"}
        />
      </Container>
    </main>
  );
}
