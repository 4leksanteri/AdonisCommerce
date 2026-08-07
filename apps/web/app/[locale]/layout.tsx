import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { Geist, Geist_Mono } from "next/font/google";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/auth/context";
import { CartProvider } from "@/lib/cart/context";
import { DisplayCurrencyProvider } from "@/lib/storefront/currency-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth/queries";
import { getDisplayCurrency, getExchangeRates } from "@/lib/storefront/currency";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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

  const [user, displayCurrency, rates] = await Promise.all([
    getCurrentUser(),
    getDisplayCurrency(),
    getExchangeRates(),
  ]);

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <AuthProvider initialUser={user}>
            <DisplayCurrencyProvider displayCurrency={displayCurrency} rates={rates}>
              <CartProvider>
              <Header platformName={APP_NAME} />
              {children}
              <Footer platformName={APP_NAME} />
              </CartProvider>
            </DisplayCurrencyProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
