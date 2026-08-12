"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertDialog, Button, Card, Input, Label, Spinner, TextField, toast } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/context";
import { closeAccountAction } from "@/lib/account/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import { FormErrors } from "./form-errors";

/**
 * Closing an account anonymises it rather than deleting it, and the copy says
 * so plainly — orders and reviews stay, with the name taken off. Promising a
 * deletion we cannot perform would be the worse lie.
 */
export function CloseAccount() {
  const t = useTranslations("Account.close");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const { setUser } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function close() {
    setErrorMessages([]);
    setIsPending(true);
    const result = await closeAccountAction(password);
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

    setIsOpen(false);
    // The session is already gone server-side; this clears the copy the
    // header is rendering from so the page doesn't claim they're signed in.
    setUser(null);
    toast.success(t("closed"));
    router.push("/");
  }

  return (
    <Card className="max-w-lg">
      <Card.Header>
        <Card.Title>{t("heading")}</Card.Title>
        <Card.Description>{t("explainer")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-col gap-3">
          <FormErrors messages={errorMessages} />

          <AlertDialog isOpen={isOpen} onOpenChange={setIsOpen}>
            <Button className="w-fit" variant="danger" onPress={() => setIsOpen(true)}>
              {t("button")}
            </Button>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog className="sm:max-w-[420px]">
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Heading>{t("confirmHeading")}</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-muted">{t("confirmBody")}</p>

                      <FormErrors messages={errorMessages} />

                      <TextField
                        isDisabled={isPending}
                        type="password"
                        value={password}
                        onChange={setPassword}
                      >
                        <Label>{t("passwordLabel")}</Label>
                        <Input className="border border-border" autoComplete="current-password" />
                      </TextField>
                    </div>
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button
                      variant="tertiary"
                      isDisabled={isPending}
                      onPress={() => setIsOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="danger"
                      isPending={isPending}
                      isDisabled={password.length === 0}
                      onPress={close}
                    >
                      {({ isPending: pending }) => (
                        <>
                          {pending && <Spinner color="current" size="sm" />}
                          {t("confirmButton")}
                        </>
                      )}
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </div>
      </Card.Content>
    </Card>
  );
}
