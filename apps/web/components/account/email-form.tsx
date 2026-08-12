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
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { useAuth } from "@/lib/auth/context";
import { updateEmailAction } from "@/lib/account/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import { FormErrors } from "./form-errors";

/**
 * Separate from the profile form because this is the login identity, not a
 * preference: it asks for the current password. There is no confirmation link
 * to the new address yet, so the password is the only thing standing between
 * a borrowed session and a stolen account.
 */
export function EmailForm({ email }: { email: string }) {
  const { user, setUser } = useAuth();
  const t = useTranslations("Account.email");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");

  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    const form = e.currentTarget;
    const data = new FormData(form);

    setIsPending(true);
    const result = await updateEmailAction(
      String(data.get("email") ?? ""),
      String(data.get("currentPassword") ?? "")
    );
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
    // The address is kept, the password field is not.
    form.reset();
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

            <TextField
              isRequired
              isDisabled={isPending}
              type="email"
              name="email"
              defaultValue={email}
            >
              <Label>{t("emailLabel")}</Label>
              <Input className="border border-border" />
              <Description>{t("emailHint")}</Description>
            </TextField>

            <TextField isRequired isDisabled={isPending} type="password" name="currentPassword">
              <Label>{t("currentPasswordLabel")}</Label>
              <Input className="border border-border" autoComplete="current-password" />
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
