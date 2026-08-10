"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { loginAction, registerAction, forgotPasswordAction } from "@/lib/auth/actions";
import { useAuth } from "@/lib/auth/context";
import { translateApiErrors } from "@/lib/translate-api-error";

type Mode = "login" | "register" | "forgot-password";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export function AuthModal() {
  const { setUser } = useAuth();
  const state = useOverlayState();
  const locale = useLocale();
  const t = useTranslations("AuthModal");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");

  const [mode, setMode] = useState<Mode>("login");
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const headings: Record<Mode, string> = {
    login: t("logInHeading"),
    register: t("registerHeading"),
    "forgot-password": t("forgotPasswordHeading"),
  };

  function switchMode(next: Mode) {
    setMode(next);
    setErrorMessages([]);
    setSuccessMessage(null);
  }

  function handleOpenChange(isOpen: boolean) {
    state.setOpen(isOpen);
    if (!isOpen) {
      setErrorMessages([]);
      setSuccessMessage(null);
      setMode("login");
    }
  }

  function showErrors(errors: Parameters<typeof translateApiErrors>[0]) {
    setErrorMessages(
      translateApiErrors(errors, {
        apiMessage: (code) => tApiMessages(code as Parameters<typeof tApiMessages>[0]),
        validationRule: (key) => tValidation(`rules.${key}` as Parameters<typeof tValidation>[0]),
      })
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));

    if (mode === "forgot-password") {
      setIsPending(true);
      const result = await forgotPasswordAction(email, locale);
      setIsPending(false);

      if (result.errors) {
        showErrors(result.errors);
        return;
      }
      setSuccessMessage(tApiMessages(result.code as Parameters<typeof tApiMessages>[0]));
      return;
    }

    const password = String(formData.get("password"));

    setIsPending(true);
    const result =
      mode === "login"
        ? await loginAction(email, password)
        : await registerAction(
            String(formData.get("fullName")),
            email,
            password,
            String(formData.get("passwordConfirmation")),
            locale
          );
    setIsPending(false);

    if (result.errors) {
      showErrors(result.errors);
      return;
    }

    setUser(result.user);
    handleOpenChange(false);
  }

  return (
    <>
      <Button variant="outline" onPress={state.open}>
        {t("logInButton")}
      </Button>

      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={handleOpenChange}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-sm">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{headings[mode]}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {successMessage ? (
                <>
                  <div className="rounded-lg bg-success-soft p-3 text-sm text-success-soft-foreground">
                    <p>{successMessage}</p>
                  </div>
                  <p className="mt-4 text-center text-sm text-muted">
                    <button
                      type="button"
                      className="font-medium text-foreground underline"
                      onClick={() => switchMode("login")}
                    >
                      {t("backToLogin")}
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    {errorMessages.length > 0 && (
                      <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
                        {errorMessages.map((message) => (
                          <p key={message}>{message}</p>
                        ))}
                      </div>
                    )}

                    {mode === "register" && (
                      <TextField isRequired isDisabled={isPending} name="fullName" type="text">
                        <Label>{t("fullNameLabel")}</Label>
                        <Input placeholder={t("fullNamePlaceholder")} className="border border-border" />
                        <FieldError />
                      </TextField>
                    )}

                    <TextField
                      isRequired
                      isDisabled={isPending}
                      name="email"
                      type="email"
                      validate={(value) => (EMAIL_PATTERN.test(value) ? null : tValidation("invalidEmail"))}
                    >
                      <Label>{t("emailLabel")}</Label>
                      <Input placeholder={t("emailPlaceholder")} className="border border-border" />
                      <FieldError />
                    </TextField>

                    {mode !== "forgot-password" && (
                      <TextField
                        isRequired
                        isDisabled={isPending}
                        minLength={8}
                        name="password"
                        type="password"
                        validate={(value) => (value.length >= 8 ? null : tValidation("passwordTooShort"))}
                      >
                        <Label>{t("passwordLabel")}</Label>
                        <Input placeholder={t("passwordPlaceholder")} className="border border-border" />
                        <FieldError />
                        {mode === "login" && (
                          <button
                            type="button"
                            disabled={isPending}
                            className="mt-1.5 text-sm font-medium text-foreground underline disabled:pointer-events-none disabled:opacity-50"
                            onClick={() => switchMode("forgot-password")}
                          >
                            {t("forgotPasswordLink")}
                          </button>
                        )}
                      </TextField>
                    )}

                    {mode === "register" && (
                      <TextField isRequired isDisabled={isPending} name="passwordConfirmation" type="password">
                        <Label>{t("confirmPasswordLabel")}</Label>
                        <Input placeholder={t("confirmPasswordPlaceholder")} className="border border-border" />
                        <FieldError />
                      </TextField>
                    )}

                    <Button type="submit" isPending={isPending} fullWidth>
                      {({ isPending: pending }) => (
                        <>
                          {pending && <Spinner color="current" size="sm" />}
                          {mode === "login" && t("logInButton")}
                          {mode === "register" && t("createAccountButton")}
                          {mode === "forgot-password" && t("sendResetLinkButton")}
                        </>
                      )}
                    </Button>
                  </Form>

                  <p className="mt-4 text-center text-sm text-muted">
                    {mode === "login" && (
                      <>
                        {t("noAccount")}{" "}
                        <button
                          type="button"
                          disabled={isPending}
                          className="font-medium text-foreground underline disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => switchMode("register")}
                        >
                          {t("registerLink")}
                        </button>
                      </>
                    )}
                    {mode === "register" && (
                      <>
                        {t("haveAccount")}{" "}
                        <button
                          type="button"
                          disabled={isPending}
                          className="font-medium text-foreground underline disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => switchMode("login")}
                        >
                          {t("logInLink")}
                        </button>
                      </>
                    )}
                    {mode === "forgot-password" && (
                      <>
                        {t("rememberedPassword")}{" "}
                        <button
                          type="button"
                          disabled={isPending}
                          className="font-medium text-foreground underline disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => switchMode("login")}
                        >
                          {t("logInLink")}
                        </button>
                      </>
                    )}
                  </p>
                </>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
