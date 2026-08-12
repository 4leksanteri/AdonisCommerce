import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/queries";
import { getConversationThread } from "@/lib/messages/queries";
import { Thread } from "@/components/messages/thread";

export default async function AccountMessageThreadPage(
  props: PageProps<"/[locale]/account/messages/[id]">
) {
  const { id } = await props.params;

  if (!(await getCurrentUser())) return null;

  const [thread, t] = await Promise.all([getConversationThread(id), getTranslations("Messages")]);

  // Also covers someone else's conversation — the API 404s it rather than
  // confirming that it exists.
  if (!thread) notFound();

  const shopSlug = thread.conversation.with.slug;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/account/messages"
          className="text-sm font-medium text-accent no-underline hover:underline"
        >
          {t("backToInbox")}
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">
          {shopSlug ? (
            <Link
              href={{ pathname: "/shop/[shopSlug]", params: { shopSlug } }}
              className="text-foreground no-underline hover:underline"
            >
              {thread.conversation.with.name}
            </Link>
          ) : (
            (thread.conversation.with.name ?? t("unknownParty"))
          )}
        </h1>
      </div>

      <Thread thread={thread} />
    </div>
  );
}
