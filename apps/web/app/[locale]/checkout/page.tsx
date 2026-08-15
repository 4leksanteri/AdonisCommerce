import { Container } from "@/components/ui/container";
import { CheckoutForm } from "@/components/storefront/checkout-form";

/**
 * Deliberately thin. The heading, the back link and the step indicator all
 * belong to the form's own state — which step you are on is the same fact as
 * whether the orders have been placed — so they are rendered there rather
 * than split across a server shell that would have to be told.
 */
export default function CheckoutPage() {
  return (
    <main className="flex-1 pt-9 pb-16">
      <Container width="checkout">
        <CheckoutForm />
      </Container>
    </main>
  );
}
