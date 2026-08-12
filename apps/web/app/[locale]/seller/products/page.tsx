import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { currencyFormat, toMajorUnits } from "@/lib/format";
import { requireSeller, getSellerProducts } from "@/lib/seller/queries";

function statusColor(status: string): "success" | "danger" | undefined {
  if (status === "active") return "success";
  if (status === "archived") return "danger";
  return undefined;
}

export default async function SellerProductsPage(props: PageProps<"/[locale]/seller/products">) {
  const { locale } = await props.params;
  await requireSeller(locale);

  const [products, t, tStatus, format] = await Promise.all([
    getSellerProducts(),
    getTranslations("SellerPanel.products"),
    getTranslations("SellerPanel.productStatus"),
    getFormatter(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
        </div>
        <Link
          href="/seller/products/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background no-underline"
        >
          {t("newProduct")}
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted">{t("empty")}</div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {products.map((product) => {
            const prices = product.variants.map((variant) => variant.priceCents);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const money = (cents: number) =>
              format.number(toMajorUnits(cents), currencyFormat(product.currency));
            const priceLabel = min === max ? money(min) : `${money(min)}–${money(max)}`;

            const thumbnail = product.images[0];

            return (
              <Link
                key={product.id}
                href={{ pathname: "/seller/products/[id]", params: { id: product.id } }}
                className="flex items-center justify-between gap-4 p-4 no-underline hover:bg-surface"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                    {thumbnail && (
                      <Image
                        src={thumbnail.url}
                        alt=""
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{product.title}</p>
                    <p className="text-sm text-muted">
                      {t("variantCount", { count: product.variants.length })} · {priceLabel}
                    </p>
                  </div>
                </div>
                <Chip color={statusColor(product.status)}>
                  <Chip.Label>{tStatus(product.status as Parameters<typeof tStatus>[0])}</Chip.Label>
                </Chip>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
