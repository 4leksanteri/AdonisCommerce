"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, Form, Input, Label, Spinner, TextArea, TextField, toast } from "@heroui/react";
import { updateSellerAction } from "@/lib/seller/actions";
import { useAuth } from "@/lib/auth/context";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { Seller } from "@/lib/auth/types";

export function SellerSettingsForm({ seller }: { seller: Seller }) {
  const { user, setUser } = useAuth();
  const t = useTranslations("SellerPanel.settings");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");

  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    const formData = new FormData(e.currentTarget);
    const shopName = String(formData.get("shopName"));
    const description = String(formData.get("description") ?? "");

    setIsPending(true);
    const result = await updateSellerAction(shopName, description);
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

    if (user) setUser({ ...user, seller: result.seller });
    toast.success(t("saveSuccess"));
  }

  return (
    <Card className="max-w-lg">
      <Form onSubmit={handleSubmit}>
        <Card.Content>
          <div className="flex flex-col gap-4">
            {errorMessages.length > 0 && (
              <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
                {errorMessages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}

            <TextField isRequired isDisabled={isPending} name="shopName" defaultValue={seller.shopName} minLength={2}>
              <Label>{t("shopNameLabel")}</Label>
              <Input className="border border-border" />
            </TextField>

            <TextField isDisabled={isPending} name="description" defaultValue={seller.description ?? ""}>
              <Label>{t("descriptionLabel")}</Label>
              <TextArea className="h-32 border border-border" placeholder={t("descriptionPlaceholder")} />
            </TextField>
          </div>
        </Card.Content>
        <Card.Footer>
          <Button type="submit" isPending={isPending}>
            {({ isPending: pending }) => (
              <>
                {pending && <Spinner color="current" size="sm" />}
                {t("saveButton")}
              </>
            )}
          </Button>
        </Card.Footer>
      </Form>
    </Card>
  );
}
