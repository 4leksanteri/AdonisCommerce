"use client";

import { useTranslations } from "next-intl";
import { Avatar, Dropdown, Label } from "@heroui/react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/context";
import { AuthModal } from "@/components/auth/modal";
import { logoutAction } from "@/lib/auth/actions";
import { Container } from "@/components/ui/container";
import { CartPopover } from "@/components/cart/popover";

export function Header() {
  const { user, setUser } = useAuth();
  const t = useTranslations("Header");
  const router = useRouter();

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

        <div className="flex items-center gap-2">
          <CartPopover />

          {user ? (
            <Dropdown>
              <Dropdown.Trigger aria-label="Account menu" className="ml-1 rounded-full">
                <Avatar>
                  <Avatar.Fallback>{user.initials}</Avatar.Fallback>
                </Avatar>
              </Dropdown.Trigger>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === "logout") handleLogout();
                    if (key === "seller-dashboard") router.push("/seller");
                  }}
                >
                  <Dropdown.Item id="account" textValue="My account">
                    <Label>{t("myAccount")}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="orders" textValue="Orders">
                    <Label>{t("orders")}</Label>
                  </Dropdown.Item>
                  {user.seller && (
                    <Dropdown.Item id="seller-dashboard" textValue="Seller dashboard">
                      <Label>{t("sellerDashboard")}</Label>
                    </Dropdown.Item>
                  )}
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
