import { Container } from "@/components/ui/container";
import { StaffNav } from "@/components/staff/nav";

export default function StaffLayout({ children }: LayoutProps<"/[locale]/staff">) {
  return (
    <main className="flex-1 py-10">
      <Container className="flex flex-col gap-8 md:flex-row md:items-start">
        <StaffNav />
        <div className="flex-1">{children}</div>
      </Container>
    </main>
  );
}
