"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button, Spinner, TextArea, TextField } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { replyAction } from "@/lib/messages/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { ConversationThread } from "@/lib/messages/types";

/**
 * The same thread on both sides. Which end you are on only decides whose
 * messages sit on the right, and the server says which end that is rather
 * than the page working it out from who is logged in.
 */
export function Thread({ thread }: { thread: ConversationThread }) {
  const t = useTranslations("Messages");
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
    const result = await replyAction(thread.conversation.id, body);
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

  return (
    <div className="flex flex-col gap-4">
      {errorMessages.length > 0 && (
        <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {thread.messages.map((message) => {
          const isMine = message.senderRole === thread.role;

          return (
            <li key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  isMine ? "bg-foreground text-background" : "bg-selected text-foreground"
                }`}
              >
                <p className="text-xs opacity-70">
                  {isMine
                    ? t("you")
                    : (message.senderName ??
                      thread.conversation.with.name ??
                      t("unknownParty"))}{" "}
                  ·{" "}
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

      <div className="flex flex-col gap-2">
        <TextField
          aria-label={t("replyLabel")}
          isDisabled={isPending}
          value={body}
          onChange={setBody}
        >
          <TextArea rows={3} placeholder={t("replyPlaceholder")} />
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
    </div>
  );
}
