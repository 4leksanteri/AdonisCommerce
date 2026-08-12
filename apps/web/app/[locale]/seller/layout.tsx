import { Container } from "@/components/ui/container";
import { SellerNav } from "@/components/seller/nav";
import { getUnreadCounts } from "@/lib/messages/queries";

export default async function SellerLayout({ children }: LayoutProps<"/[locale]/seller">) {
  // Signed out or shopless, this answers zero rather than failing — the
  // pages inside do their own `requireSeller`, which is what redirects.
  const unread = await getUnreadCounts();

  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-8 md:flex-row md:items-start">
        <SellerNav unreadMessages={unread.seller} />
        <div className="flex-1">{children}</div>
      </Container>
    </main>
  );
}
