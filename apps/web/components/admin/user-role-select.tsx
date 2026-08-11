"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Label, ListBox, Select, toast } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { setUserRoleAction } from "@/lib/admin/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { AdminUser } from "@/lib/admin/types";

const ROLES = ["customer", "staff", "admin"] as const;

/**
 * Changing a role takes effect on selection rather than behind a Save button.
 * The dangerous part isn't the number of clicks — it's the change being
 * unattributed, which the API records — and an extra confirm on a screen only
 * admins can reach mostly trains people to click through it.
 */
export function UserRoleSelect({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const t = useTranslations("Admin");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);

  async function change(role: string) {
    if (role === user.role) return;

    setIsPending(true);
    const result = await setUserRoleAction(user.id, role);
    setIsPending(false);

    if (result.errors) {
      toast.danger(
        translateApiErrors(result.errors, {
          apiMessage: (code) => tApiMessages(code as Parameters<typeof tApiMessages>[0]),
          validationRule: (key) => tValidation(`rules.${key}` as Parameters<typeof tValidation>[0]),
        }).join(" ")
      );
      return;
    }

    toast.success(
      t("roleChanged", {
        email: user.email,
        role: t(`role.${role}` as "role.staff"),
      })
    );
    router.refresh();
  }

  return (
    <Select
      aria-label={t("roleLabel")}
      // Locked on your own row: the screen that would undo a self-demotion is
      // the one you'd have just lost. The API refuses it too.
      isDisabled={isPending || isSelf}
      selectedKey={user.role}
      onSelectionChange={(key) => change(String(key))}
      className="w-40"
    >
      <Label className="sr-only">{t("roleLabel")}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {ROLES.map((role) => (
            <ListBox.Item key={role} id={role} textValue={t(`role.${role}` as "role.staff")}>
              {t(`role.${role}` as "role.staff")}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
