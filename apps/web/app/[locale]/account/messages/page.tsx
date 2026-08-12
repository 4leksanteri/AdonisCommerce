import { getTranslations } from "next-intl/server";
import { AccountBackLink } from "@/components/account/back-link";
import { getCurrentUser } from "@/lib/auth/queries";
import { getInbox } from "@/lib/messages/queries";
import { InboxList } from "@/components/messages/inbox-list";

export default async function AccountMessagesPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("Messages")]);

  // Signed out, the layout shows the sign-in prompt in place of this.
  if (!user) return null;

  const inbox = await getInbox("buyer");

  return (
    <div className="flex flex-col gap-6">
      <div>
        {/* Inside the heading block, not a sibling in the gap-6 stack — a
            back link belongs to the title it returns from, and 24px of air
            reads as two unrelated things. */}
        <AccountBackLink />
        <h1 className="mt-1.5 text-xl font-semibold text-foreground md:mt-0">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("buyerSubheading")}</p>
      </div>

      <InboxList conversations={inbox.conversations} role="buyer" />
    </div>
  );
}
