import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { CheckoutForm } from "@/components/storefront/checkout-form";

export default async function CheckoutPage() {
  const t = await getTranslations("Checkout");

  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
        </div>

        <CheckoutForm />
      </Container>
    </main>
  );
}
