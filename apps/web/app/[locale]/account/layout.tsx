import { getTranslations } from "next-intl/server";
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
      {/*
        Sized by its contents, not by the header. The panel is a nav and one
        reading column; stretching that across the full shell leaves a third
        of the row empty and reads as bunched to the left rather than as
        centred. So the pair shrink-wraps and the pair is what gets centred.
      */}
      <div className="mx-auto flex w-full max-w-[35rem] flex-col gap-8 px-6 md:w-fit md:max-w-none md:flex-row md:items-start md:gap-12">
        {user ? (
          <>
            <AccountNav unreadMessages={unread?.buyer ?? 0} />
            {/* A fixed column, so the nav doesn't shift sideways when a
                page with different content is opened. */}
            <div className="w-full min-w-0 md:w-[35rem]">{children}</div>
          </>
        ) : (
          <div className="w-full rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted md:w-[35rem]">
            {t("signInRequired")}
          </div>
        )}
      </div>
    </main>
  );
}
