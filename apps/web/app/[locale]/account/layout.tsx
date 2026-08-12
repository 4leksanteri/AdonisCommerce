import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { AccountNav } from "@/components/account/nav";
import { getCurrentUser } from "@/lib/auth/queries";
import { getUnreadCounts } from "@/lib/messages/queries";

/**
 * The one panel that asks rather than redirects.
 *
 * Seller, staff and admin send the wrong person home: they have no business
 * there at all. A shopper following an order link out of their inbox on a
 * phone they aren't signed in on has every business here — they just have to
 * say who they are, and the header's sign-in dialog is right above this.
 */
export default async function AccountLayout({ children }: LayoutProps<"/[locale]/account">) {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("Account")]);
  // Only worth asking for once we know there is someone to count for.
  const unread = user ? await getUnreadCounts() : null;

  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-8 md:flex-row md:items-start">
        {user ? (
          <>
            <AccountNav unreadMessages={unread?.buyer ?? 0} />
            <div className="min-w-0 flex-1">{children}</div>
          </>
        ) : (
          <div className="flex-1 rounded-card border border-border p-8 text-center text-sm text-muted">
            {t("signInRequired")}
          </div>
        )}
      </Container>
    </main>
  );
}
