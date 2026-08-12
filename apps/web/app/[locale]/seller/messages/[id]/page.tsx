import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireSeller } from "@/lib/seller/queries";
import { getConversationThread } from "@/lib/messages/queries";
import { Thread } from "@/components/messages/thread";

export default async function SellerMessageThreadPage(
  props: PageProps<"/[locale]/seller/messages/[id]">
) {
  const { locale, id } = await props.params;
  await requireSeller(locale);

  const [thread, t] = await Promise.all([getConversationThread(id), getTranslations("Messages")]);

  if (!thread) notFound();

  return (
    <div className="flex max-w-reading flex-col gap-6">
      <div>
        <Link
          href="/seller/messages"
          className="text-sm text-muted no-underline hover:text-foreground"
        >
          {t("backToInbox")}
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-foreground">
          {thread.conversation.with.name ?? t("unknownParty")}
        </h1>
      </div>

      <Thread thread={thread} />
    </div>
  );
}
