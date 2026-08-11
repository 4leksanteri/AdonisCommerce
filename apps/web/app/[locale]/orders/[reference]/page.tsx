import { redirect } from "@/i18n/navigation";

/**
 * Moved under the account panel. This one matters most of the three: every
 * order notification sent so far links here, and those emails don't change.
 */
export default async function LegacyOrderPage(props: PageProps<"/[locale]/orders/[reference]">) {
  const { locale, reference } = await props.params;
  redirect({ href: { pathname: "/account/orders/[reference]", params: { reference } }, locale });
}
