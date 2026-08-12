"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Spinner, toast } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { ShopAvatar } from "@/components/storefront/shop-avatar";
import { useAuth } from "@/lib/auth/context";
import { removeShopAvatarAction, uploadShopAvatarAction } from "@/lib/seller/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { Seller } from "@/lib/auth/types";

/**
 * Saves on selection rather than waiting for the settings form to submit.
 * A picture is not a text field — nobody expects to press Save after
 * choosing one, and the form around this posts JSON while an upload has to
 * be multipart.
 */
export function ShopAvatarField({ seller }: { seller: Seller }) {
  const t = useTranslations("SellerPanel.settings");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const current = user?.seller ?? seller;

  async function run(action: () => Promise<{ seller?: Seller; errors?: Parameters<typeof translateApiErrors>[0] }>) {
    setErrorMessages([]);
    setIsPending(true);

    const result = await action();
    setIsPending(false);

    if (result.errors) {
      setErrorMessages(
        translateApiErrors(result.errors, {
          apiMessage: (code) => tApiMessages(code as Parameters<typeof tApiMessages>[0]),
          validationRule: (key) => tValidation(`rules.${key}` as Parameters<typeof tValidation>[0]),
        })
      );
      return;
    }

    // Kept in the auth context too, so the header and panel don't show a
    // stale picture until the next full load.
    if (user && result.seller) setUser({ ...user, seller: result.seller });
    toast.success(t("avatarSaved"));
    router.refresh();
  }

  function handleSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset first: picking the same file twice must still fire a change.
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    run(() => uploadShopAvatarAction(formData));
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm text-muted">{t("avatarLabel")}</span>

      {errorMessages.length > 0 && (
        <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <ShopAvatar name={current.shopName} url={current.avatarUrl} size="lg" />

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-card border border-border px-3 py-2 text-sm text-foreground hover:bg-surface">
            {isPending ? <Spinner size="sm" /> : t(current.avatarUrl ? "avatarChange" : "avatarAdd")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={isPending}
              onChange={handleSelected}
            />
          </label>

          {current.avatarUrl && (
            <Button
              variant="outline"
              isDisabled={isPending}
              onPress={() => run(removeShopAvatarAction)}
            >
              {t("avatarRemove")}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted">{t("avatarHint")}</p>
    </div>
  );
}
