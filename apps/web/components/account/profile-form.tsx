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
  TextField,
  toast,
} from "@heroui/react";
import { useAuth } from "@/lib/auth/context";
import { updateProfileAction } from "@/lib/account/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import { FormErrors } from "./form-errors";

const EMAIL_LOCALES = [
  { id: "en", label: "English" },
  { id: "fi", label: "Suomi" },
] as const;

export function ProfileForm({ fullName, locale }: { fullName: string | null; locale: string }) {
  const { user, setUser } = useAuth();
  const t = useTranslations("Account.profile");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");

  const [emailLocale, setEmailLocale] = useState(locale);
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    const name = String(new FormData(e.currentTarget).get("fullName") ?? "").trim();

    setIsPending(true);
    // Empty means "no name given", which is null on the row rather than an
    // empty string — the model treats both the same and null says it plainly.
    const result = await updateProfileAction(name || null, emailLocale);
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

    if (user) setUser({ ...user, ...result.user });
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
        <Card.Header>
          <Card.Title>{t("heading")}</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-4">
            <FormErrors messages={errorMessages} />

            <TextField isDisabled={isPending} name="fullName" defaultValue={fullName ?? ""}>
              <Label>{t("nameLabel")}</Label>
              <Input className="border border-border" />
              <Description>{t("nameHint")}</Description>
            </TextField>

            <Select
              isDisabled={isPending}
              selectedKey={emailLocale}
              onSelectionChange={(key) => setEmailLocale(String(key))}
            >
              <Label>{t("localeLabel")}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {EMAIL_LOCALES.map((option) => (
                    <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
              {/* Only emails. The site's own language comes from the URL, so
                  the switcher in the footer is what changes that. */}
              <Description>{t("localeHint")}</Description>
            </Select>
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
