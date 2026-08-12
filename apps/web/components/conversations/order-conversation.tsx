"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button, Spinner, TextArea, TextField } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { sendMessageAction } from "@/lib/conversations/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { Conversation, SenderRole } from "@/lib/conversations/types";
import type { ApiErrorItem } from "@/lib/api";

/**
 * The same thread on the buyer's order page, the seller's order page and the
 * staff dispute page. Which side you are on only changes whose messages sit
 * on the right and whether a composer is shown — and the server decides both.
 */
export function OrderConversation({
  orderId,
  conversation,
}: {
  orderId: string;
  conversation: Conversation;
}) {
  const t = useTranslations("Conversation");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const format = useFormatter();
  const router = useRouter();

  const [body, setBody] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  async function send() {
    if (!body.trim()) return;

    setErrorMessages([]);
    setIsPending(true);

    const result: { errors?: ApiErrorItem[] } = await sendMessageAction(orderId, body);
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

    setBody("");
    router.refresh();
  }

  /** Whose message it is, from the reader's point of view. */
  function label(senderRole: SenderRole, senderName: string | null) {
    if (senderRole === "staff") return t("fromStaff");
    if (senderRole === conversation.role) return t("fromYou");
    return senderName ?? t(senderRole === "buyer" ? "fromBuyer" : "fromSeller");
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border p-4">
      <div>
        <h2 className="font-medium text-foreground">{t("heading")}</h2>
        <p className="mt-1 text-sm text-muted">
          {conversation.canPost ? t("hint") : t("readOnlyHint")}
        </p>
      </div>

      {errorMessages.length > 0 && (
        <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      {conversation.messages.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {conversation.messages.map((message) => {
            const isMine = message.senderRole === conversation.role;

            return (
              <li key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-card px-3 py-2 ${
                    isMine
                      ? "bg-foreground text-background"
                      : // Staff are visually distinct from the other party, so
                        // nobody mistakes a platform decision for the shop's.
                        message.senderRole === "staff"
                        ? "bg-accent-soft text-accent-soft-foreground"
                        : "bg-surface text-foreground"
                  }`}
                >
                  <p className="text-xs opacity-70">
                    {label(message.senderRole, message.senderName)} ·{" "}
                    {format.dateTime(new Date(message.createdAt), {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="mt-0.5 text-sm whitespace-pre-line">{message.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {conversation.canPost && (
        <div className="flex flex-col gap-2">
          <TextField
            aria-label={t("heading")}
            isDisabled={isPending}
            value={body}
            onChange={setBody}
          >
            <TextArea className="border border-border" rows={3} placeholder={t("placeholder")} />
          </TextField>

          <Button
            className="self-start"
            isPending={isPending}
            isDisabled={body.trim().length === 0}
            onPress={send}
          >
            {({ isPending: pending }) => (
              <>
                {pending && <Spinner color="current" size="sm" />}
                {t("send")}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
