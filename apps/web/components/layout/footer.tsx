import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export function Footer({ platformName }: { platformName: string }) {
  return (
    <footer className="border-t border-border">
      <Container className="flex h-16 items-center justify-between">
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} {platformName}
        </p>
        <LocaleSwitcher />
      </Container>
    </footer>
  );
}
