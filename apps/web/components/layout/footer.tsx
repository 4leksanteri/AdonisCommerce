import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { getDisplayCurrency } from "@/lib/storefront/currency";

export async function Footer({ platformName }: { platformName: string }) {
  const displayCurrency = await getDisplayCurrency();

  return (
    <footer className="border-t border-chrome-border bg-chrome">
      <Container className="flex h-16 items-center justify-between">
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} {platformName}
        </p>
        {/* Language and currency are independent choices — someone in Helsinki
            may well want English prices in EUR, or Finnish ones in SEK. */}
        <div className="flex items-center gap-4">
          <CurrencySwitcher current={displayCurrency} />
          <LocaleSwitcher />
        </div>
      </Container>
    </footer>
  );
}
