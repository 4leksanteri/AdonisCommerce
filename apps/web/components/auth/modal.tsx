"use client";

import { useState } from "react";
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

type Mode = "login" | "register" | "forgot-password";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const HEADINGS: Record<Mode, string> = {
  login: "Log in",
  register: "Create an account",
  "forgot-password": "Reset your password",
};

export function AuthModal() {
  const { setUser } = useAuth();
  const state = useOverlayState();
  const [mode, setMode] = useState<Mode>("login");
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessages([]);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));

    if (mode === "forgot-password") {
      setIsPending(true);
      const result = await forgotPasswordAction(email);
      setIsPending(false);

      if (result.errors) {
        setErrorMessages(result.errors);
        return;
      }
      setSuccessMessage(result.message);
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
            String(formData.get("passwordConfirmation"))
          );
    setIsPending(false);

    if (result.errors) {
      setErrorMessages(result.errors);
      return;
    }

    setUser(result.user);
    handleOpenChange(false);
  }

  return (
    <>
      <Button variant="secondary" onPress={state.open}>
        Log in
      </Button>

      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={handleOpenChange}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-sm">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{HEADINGS[mode]}</Modal.Heading>
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
                      Back to log in
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
                        <Label>Full name</Label>
                        <Input placeholder="Jane Doe" className="border border-border" />
                        <FieldError />
                      </TextField>
                    )}

                    <TextField
                      isRequired
                      isDisabled={isPending}
                      name="email"
                      type="email"
                      validate={(value) => (EMAIL_PATTERN.test(value) ? null : "Enter a valid email")}
                    >
                      <Label>Email</Label>
                      <Input placeholder="you@example.com" className="border border-border" />
                      <FieldError />
                    </TextField>

                    {mode !== "forgot-password" && (
                      <TextField
                        isRequired
                        isDisabled={isPending}
                        minLength={8}
                        name="password"
                        type="password"
                        validate={(value) =>
                          value.length >= 8 ? null : "Password must be at least 8 characters"
                        }
                      >
                        <Label>Password</Label>
                        <Input placeholder="Enter your password" className="border border-border" />
                        <FieldError />
                        {mode === "login" && (
                          <button
                            type="button"
                            disabled={isPending}
                            className="mt-1.5 text-sm font-medium text-foreground underline disabled:pointer-events-none disabled:opacity-50"
                            onClick={() => switchMode("forgot-password")}
                          >
                            Forgot password?
                          </button>
                        )}
                      </TextField>
                    )}

                    {mode === "register" && (
                      <TextField isRequired isDisabled={isPending} name="passwordConfirmation" type="password">
                        <Label>Confirm password</Label>
                        <Input placeholder="Re-enter your password" className="border border-border" />
                        <FieldError />
                      </TextField>
                    )}

                    <Button type="submit" isPending={isPending} fullWidth>
                      {({ isPending: pending }) => (
                        <>
                          {pending && <Spinner color="current" size="sm" />}
                          {mode === "login" && "Log in"}
                          {mode === "register" && "Create account"}
                          {mode === "forgot-password" && "Send reset link"}
                        </>
                      )}
                    </Button>
                  </Form>

                  <p className="mt-4 text-center text-sm text-muted">
                    {mode === "login" && (
                      <>
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          disabled={isPending}
                          className="font-medium text-foreground underline disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => switchMode("register")}
                        >
                          Register
                        </button>
                      </>
                    )}
                    {mode === "register" && (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          disabled={isPending}
                          className="font-medium text-foreground underline disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => switchMode("login")}
                        >
                          Log in
                        </button>
                      </>
                    )}
                    {mode === "forgot-password" && (
                      <>
                        Remembered your password?{" "}
                        <button
                          type="button"
                          disabled={isPending}
                          className="font-medium text-foreground underline disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => switchMode("login")}
                        >
                          Log in
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
