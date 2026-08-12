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
import { updatePasswordAction } from "@/lib/account/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import { FormErrors } from "./form-errors";

const MIN_LENGTH = 8;

export function PasswordForm() {
  const t = useTranslations("Account.password");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");

  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    const form = e.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const passwordConfirmation = String(data.get("passwordConfirmation") ?? "");

    // Caught here as well as on the API, so the mismatch is pointed out
    // without a round trip.
    if (password !== passwordConfirmation) {
      setErrorMessages([t("mismatch")]);
      return;
    }

    setIsPending(true);
    const result = await updatePasswordAction(
      String(data.get("currentPassword") ?? ""),
      password,
      passwordConfirmation
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

    form.reset();
    toast.success(t("saveSuccess"));
  }

  return (
    <Card>
      {/* The card lays its own slots out with `gap-3`, but only for its direct
          children — and the form is the only one, so header, content and
          footer stacked flush against each other. Restated here rather than
          hoisting the header and footer out, since the submit button has to
          stay inside the form. */}
      <Form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <Card.Header>
          <Card.Title>{t("heading")}</Card.Title>
          {/* Said before they commit, not after they find out. */}
          <Card.Description>{t("signsOutOthers")}</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-4">
            <FormErrors messages={errorMessages} />

            <TextField isRequired isDisabled={isPending} type="password" name="currentPassword">
              <Label>{t("currentLabel")}</Label>
              <Input className="border border-border" autoComplete="current-password" />
            </TextField>

            <TextField
              isRequired
              isDisabled={isPending}
              type="password"
              name="password"
              minLength={MIN_LENGTH}
            >
              <Label>{t("newLabel")}</Label>
              <Input className="border border-border" autoComplete="new-password" />
              <Description>{t("newHint", { count: MIN_LENGTH })}</Description>
            </TextField>

            <TextField
              isRequired
              isDisabled={isPending}
              type="password"
              name="passwordConfirmation"
              minLength={MIN_LENGTH}
            >
              <Label>{t("confirmLabel")}</Label>
              <Input className="border border-border" autoComplete="new-password" />
            </TextField>
          </div>
        </Card.Content>
        <Card.Footer>
          <Button className="w-full md:w-auto" type="submit" isPending={isPending}>
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
