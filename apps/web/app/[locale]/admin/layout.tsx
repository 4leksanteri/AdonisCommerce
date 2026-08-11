import { Container } from "@/components/ui/container";
import { AdminNav } from "@/components/admin/nav";

export default function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-8 md:flex-row md:items-start">
        <AdminNav />
        <div className="flex-1">{children}</div>
      </Container>
    </main>
  );
}
