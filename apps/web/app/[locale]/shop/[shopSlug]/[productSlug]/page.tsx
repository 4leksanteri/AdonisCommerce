import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ProductDetail } from "@/components/storefront/product-detail";
import { toMajorUnits } from "@/lib/format";
import { getPublicProduct } from "@/lib/storefront/queries";
import { getDisplayCurrency, getExchangeRates } from "@/lib/storefront/currency";
import type { PublicProduct } from "@/lib/storefront/types";

type Props = PageProps<"/[locale]/shop/[shopSlug]/[productSlug]">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, shopSlug, productSlug } = await props.params;
  const product = await getPublicProduct(shopSlug, productSlug);

  if (!product) return {};

  // Canonical points at the localised path for this locale, so the two
  // language variants don't compete with each other for the same listing.
  const canonical = getPathname({
    locale,
    href: { pathname: "/shop/[shopSlug]/[productSlug]", params: { shopSlug, productSlug } },
  });

  return {
    title: `${product.title} · ${product.shop.name}`,
    description: product.description?.slice(0, 160) ?? undefined,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.title,
      description: product.description ?? undefined,
      images: product.images[0] ? [product.images[0].url] : undefined,
    },
  };
}

/**
 * schema.org Product markup — this is what earns rich results and Google
 * Shopping placement. `offers` is a list so each variant's price and
 * availability is described individually rather than flattened to one.
 */
function productJsonLd(product: PublicProduct) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: product.images.map((image) => image.url),
    brand: { "@type": "Brand", name: product.shop.name },
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      // schema.org wants a major-unit decimal string, not minor units.
      price: toMajorUnits(variant.priceCents).toFixed(2),
      priceCurrency: product.currency,
      availability:
        variant.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    })),
  };
}

export default async function ProductPage(props: Props) {
  const { shopSlug, productSlug } = await props.params;
  const [product, displayCurrency, rates] = await Promise.all([
    getPublicProduct(shopSlug, productSlug),
    getDisplayCurrency(),
    getExchangeRates(),
  ]);

  if (!product) notFound();

  return (
    <main className="flex-1 py-10">
      <script
        type="application/ld+json"
        // Serialised server-side from our own data; `<` is escaped so a
        // product description can't break out of the script element.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c"),
        }}
      />
      <Container>
        <ProductDetail product={product} displayCurrency={displayCurrency} rates={rates} />
      </Container>
    </main>
  );
}
