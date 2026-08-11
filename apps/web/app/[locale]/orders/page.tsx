import { redirect } from "@/i18n/navigation";

/** Moved under the account panel; see the note in i18n/routing.ts. */
export default async function LegacyOrdersPage(props: PageProps<"/[locale]/orders">) {
  const { locale } = await props.params;
  redirect({ href: "/account/orders", locale });
}
