import { Container } from "@/components/ui/container";
import { SellerNav } from "@/components/seller/nav";

export default function SellerLayout({ children }: LayoutProps<"/[locale]/seller">) {
  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-8 md:flex-row md:items-start">
        <SellerNav />
        <div className="flex-1">{children}</div>
      </Container>
    </main>
  );
}
