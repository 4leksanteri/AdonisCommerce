import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/auth/context";
import { CartProvider } from "@/lib/cart/context";
import { StorefrontPreferencesProvider } from "@/lib/storefront/preferences-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth/queries";
import { getDisplayCurrency, getExchangeRates, getShipToCountry } from "@/lib/storefront/currency";
import "../globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = process.env.APP_NAME ?? "Ecommerce";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_NAME,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const [user, displayCurrency, rates, shipToCountry] = await Promise.all([
    getCurrentUser(),
    getDisplayCurrency(),
    getExchangeRates(),
    getShipToCountry(),
  ]);

  return (
    <html
      lang={locale}
      className={`${instrumentSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <AuthProvider initialUser={user}>
            <StorefrontPreferencesProvider
              displayCurrency={displayCurrency}
              rates={rates}
              shipToCountry={shipToCountry}
            >
              <CartProvider>
                <Header platformName={APP_NAME} />
                {children}
                <Footer platformName={APP_NAME} />
              </CartProvider>
            </StorefrontPreferencesProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
