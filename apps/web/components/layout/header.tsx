"use client";

import { useLocale, useTranslations } from "next-intl";
import { Avatar, Dropdown, Label } from "@heroui/react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/context";
import { AuthModal } from "@/components/auth/modal";
import { logoutAction } from "@/lib/auth/actions";
import { Container } from "@/components/ui/container";

function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label="Change language" className="rounded-full px-2 text-sm font-medium">
        {locale.toUpperCase()}
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          selectionMode="single"
          selectedKeys={new Set([locale])}
          onAction={(key) => router.replace(pathname, { locale: String(key) })}
        >
          {routing.locales.map((code) => (
            <Dropdown.Item key={code} id={code} textValue={code.toUpperCase()}>
              <Label>{code.toUpperCase()}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function Header() {
  const { user, setUser } = useAuth();
  const t = useTranslations("Header");

  async function handleLogout() {
    setUser(null);
    await logoutAction();
  }

  return (
    <header className="border-b border-border">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-foreground">
          Ecommerce
        </Link>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          {user ? (
            <Dropdown>
              <Dropdown.Trigger aria-label="Account menu" className="rounded-full">
                <Avatar>
                  <Avatar.Fallback>{user.initials}</Avatar.Fallback>
                </Avatar>
              </Dropdown.Trigger>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === "logout") handleLogout();
                  }}
                >
                  <Dropdown.Item id="account" textValue="My account">
                    <Label>{t("myAccount")}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="orders" textValue="Orders">
                    <Label>{t("orders")}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="logout" textValue="Log out" variant="danger">
                    <Label>{t("logOut")}</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ) : (
            <AuthModal />
          )}
        </div>
      </Container>
    </header>
  );
}
