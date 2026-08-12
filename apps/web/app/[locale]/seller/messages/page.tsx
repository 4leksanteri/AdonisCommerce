import { getTranslations } from "next-intl/server";
import { requireSeller } from "@/lib/seller/queries";
import { getInbox } from "@/lib/messages/queries";
import { InboxList } from "@/components/messages/inbox-list";

export default async function SellerMessagesPage(props: PageProps<"/[locale]/seller/messages">) {
  const { locale } = await props.params;
  await requireSeller(locale);

  const [inbox, t] = await Promise.all([getInbox("seller"), getTranslations("Messages")]);

  return (
    <div className="flex max-w-reading flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("sellerSubheading")}</p>
      </div>

      <InboxList conversations={inbox.conversations} role="seller" />
    </div>
  );
}
