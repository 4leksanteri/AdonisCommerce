"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  Description,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { updateSellerAction } from "@/lib/seller/actions";
import { SUPPORTED_CURRENCIES } from "@/lib/format";
import { useAuth } from "@/lib/auth/context";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { Seller } from "@/lib/auth/types";

export function SellerSettingsForm({ seller }: { seller: Seller }) {
  const { user, setUser } = useAuth();
  const t = useTranslations("SellerPanel.settings");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");

  const [currency, setCurrency] = useState(seller.currency);
  const [country, setCountry] = useState(seller.country);
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    const formData = new FormData(e.currentTarget);
    const shopName = String(formData.get("shopName"));
    const description = String(formData.get("description") ?? "");

    setIsPending(true);
    const result = await updateSellerAction(shopName, description, currency, country);
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
      {/* The card lays its own slots out with `gap-3`, but only for its direct
          children — and the form is the only one, so header, content and
          footer stacked flush against each other. Restated here rather than
          hoisting the header and footer out, since the submit button has to
          stay inside the form. */}
      <Form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <Card.Content>
          <div className="flex flex-col gap-4">
            {errorMessages.length > 0 && (
              <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
                {errorMessages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}

            <TextField
              isRequired
              isDisabled={isPending}
              name="shopName"
              defaultValue={seller.shopName}
              minLength={2}
            >
              <Label>{t("shopNameLabel")}</Label>
              <Input />
            </TextField>

            <TextField
              isDisabled={isPending}
              name="description"
              defaultValue={seller.description ?? ""}
            >
              <Label>{t("descriptionLabel")}</Label>
              <TextArea className="h-32" placeholder={t("descriptionPlaceholder")} />
            </TextField>

            <Select
              isDisabled={isPending}
              selectedKey={currency}
              onSelectionChange={(key) => setCurrency(String(key))}
            >
              <Label>{t("currencyLabel")}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {SUPPORTED_CURRENCIES.map((code) => (
                    <ListBox.Item key={code} id={code} textValue={code}>
                      {code}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
              <Description>{t("currencyHint")}</Description>
            </Select>

            <TextField
              isDisabled={isPending}
              value={country}
              onChange={(value) => setCountry(value.toUpperCase().slice(0, 2))}
            >
              <Label>{t("countryLabel")}</Label>
              <Input placeholder="FI" />
              <Description>{t("countryHint")}</Description>
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
