import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/queries";
import { getInbox } from "@/lib/messages/queries";
import { InboxList } from "@/components/messages/inbox-list";

export default async function AccountMessagesPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("Messages")]);

  // Signed out, the layout shows the sign-in prompt in place of this.
  if (!user) return null;

  const inbox = await getInbox("buyer");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("buyerSubheading")}</p>
      </div>

      <InboxList conversations={inbox.conversations} role="buyer" />
    </div>
  );
}
