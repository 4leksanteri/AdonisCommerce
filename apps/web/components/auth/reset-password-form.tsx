"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, FieldError, Form, Input, Label, Spinner, TextField } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { resetPasswordAction } from "@/lib/auth/actions";
import { translateApiErrors } from "@/lib/translate-api-error";

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const t = useTranslations("ResetPasswordPage");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");

  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password"));
    const passwordConfirmation = String(formData.get("passwordConfirmation"));

    setIsPending(true);
    const result = await resetPasswordAction(email, token, password, passwordConfirmation);
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
    setSuccessMessage(tApiMessages(result.code as Parameters<typeof tApiMessages>[0]));
  }

  if (successMessage) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-success-soft p-3 text-sm text-success-soft-foreground">
          <p>{successMessage}</p>
        </div>
        <Link href="/" className="text-center text-sm font-medium text-foreground underline">
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
        minLength={8}
        name="password"
        type="password"
        validate={(value) => (value.length >= 8 ? null : tValidation("passwordTooShort"))}
      >
        <Label>{t("newPasswordLabel")}</Label>
        <Input placeholder={t("newPasswordPlaceholder")} className="border border-border" />
        <FieldError />
      </TextField>

      <TextField isRequired isDisabled={isPending} name="passwordConfirmation" type="password">
        <Label>{t("confirmNewPasswordLabel")}</Label>
        <Input placeholder={t("confirmNewPasswordPlaceholder")} className="border border-border" />
        <FieldError />
      </TextField>

      <Button type="submit" isPending={isPending} fullWidth>
        {({ isPending: pending }) => (
          <>
            {pending && <Spinner color="current" size="sm" />}
            {t("resetButton")}
          </>
        )}
      </Button>
    </Form>
  );
}
