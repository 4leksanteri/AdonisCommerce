"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ShoppingBag, TrashBin } from "@gravity-ui/icons";
import { Badge, Button, Popover } from "@heroui/react";
import { CURRENCY_FORMAT } from "@/lib/format";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color: string;
};

// Mock data — no cart/product backend yet, this is purely to shape the UI.
const MOCK_ITEMS: CartItem[] = [
  { id: "1", name: "Classic Cotton T-Shirt", price: 24.99, quantity: 2, color: "bg-blue-100" },
  { id: "2", name: "Leather Wallet", price: 49.99, quantity: 1, color: "bg-amber-100" },
  { id: "3", name: "Canvas Tote Bag", price: 19.99, quantity: 1, color: "bg-emerald-100" },
];

export function CartPopover() {
  const t = useTranslations("Cart");
  const format = useFormatter();
  const [items] = useState(MOCK_ITEMS);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Popover>
      <Popover.Trigger
        aria-label={t("openCart")}
        className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-surface"
      >
        <Badge.Anchor className="flex size-6 items-center justify-center">
          <ShoppingBag className="size-6" />
          {itemCount > 0 && (
            <Badge color="danger" size="sm">
              {itemCount}
            </Badge>
          )}
        </Badge.Anchor>
      </Popover.Trigger>

      <Popover.Content placement="bottom end" className="w-80">
        <Popover.Dialog>
          <Popover.Heading>{t("heading")}</Popover.Heading>

          {items.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t("empty")}</p>
          ) : (
            <>
              <ul className="mt-3 flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className={`size-12 shrink-0 rounded-lg ${item.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted">
                        {t("quantity")}: {item.quantity} &middot;{" "}
                        {format.number(item.price, CURRENCY_FORMAT)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={t("remove")}
                      className="text-muted hover:text-danger"
                    >
                      <TrashBin className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-medium text-foreground">{t("subtotal")}</span>
                <span className="text-sm font-semibold text-foreground">
                  {format.number(subtotal, CURRENCY_FORMAT)}
                </span>
              </div>

              <Button className="mt-4" fullWidth>
                {t("checkout")}
              </Button>
            </>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
