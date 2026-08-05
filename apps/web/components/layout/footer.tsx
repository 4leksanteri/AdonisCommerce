import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="flex h-16 items-center justify-between">
        <p className="text-sm text-muted">&copy; {new Date().getFullYear()} Ecommerce</p>
        <LocaleSwitcher />
      </Container>
    </footer>
  );
}
