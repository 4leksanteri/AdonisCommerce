import { redirect } from "@/i18n/navigation";

/**
 * The panel has no overview of its own — a shopper's account is their orders
 * and their settings, and a dashboard summarising two pages is furniture.
 */
export default async function AccountPage(props: PageProps<"/[locale]/account">) {
  const { locale } = await props.params;
  redirect({ href: "/account/orders", locale });
}
