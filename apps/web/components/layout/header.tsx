"use client";

import Link from "next/link";
import { Avatar, Dropdown, Label } from "@heroui/react";
import { useAuth } from "@/lib/auth/context";
import { AuthModal } from "@/components/auth/modal";
import { logoutAction } from "@/lib/auth/actions";
import { Container } from "@/components/ui/container";

export function Header() {
  const { user, setUser } = useAuth();

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
                    <Label>My account</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="orders" textValue="Orders">
                    <Label>Orders</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="logout" textValue="Log out" variant="danger">
                    <Label>Log out</Label>
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
