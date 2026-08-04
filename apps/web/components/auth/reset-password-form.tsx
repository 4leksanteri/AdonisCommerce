"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, FieldError, Form, Input, Label, Spinner, TextField } from "@heroui/react";
import { resetPasswordAction } from "@/lib/auth/actions";

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
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
      setErrorMessages(result.errors);
      return;
    }
    setSuccessMessage(result.message);
  }

  if (successMessage) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-success-soft p-3 text-sm text-success-soft-foreground">
          <p>{successMessage}</p>
        </div>
        <Link href="/" className="text-center text-sm font-medium text-foreground underline">
          Back to home
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
        validate={(value) => (value.length >= 8 ? null : "Password must be at least 8 characters")}
      >
        <Label>New password</Label>
        <Input placeholder="Enter your new password" className="border border-border" />
        <FieldError />
      </TextField>

      <TextField isRequired isDisabled={isPending} name="passwordConfirmation" type="password">
        <Label>Confirm new password</Label>
        <Input placeholder="Re-enter your new password" className="border border-border" />
        <FieldError />
      </TextField>

      <Button type="submit" isPending={isPending} fullWidth>
        {({ isPending: pending }) => (
          <>
            {pending && <Spinner color="current" size="sm" />}
            Reset password
          </>
        )}
      </Button>
    </Form>
  );
}
