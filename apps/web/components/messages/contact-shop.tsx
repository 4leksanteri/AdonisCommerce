"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal, Spinner, TextArea, TextField } from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/context";
import { startConversationAction } from "@/lib/messages/actions";
import { translateApiErrors } from "@/lib/translate-api-error";

/**
 * The way into messaging from the shop and product pages.
 *
 * Hidden from the shop's own owner rather than shown and then refused — the
 * API rejects it either way, but offering someone a button that can only
 * fail is worse than not offering it.
 */
export function ContactShop({
  shopSlug,
  shopName,
  className,
}: {
  shopSlug: string;
  shopName: string;
  /** For the trigger only — the modal is the same wherever it is opened from. */
  className?: string;
}) {
  const t = useTranslations("Messages");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const { user } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [body, setBody] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  if (user?.seller?.slug === shopSlug) return null;

  async function send() {
    if (!body.trim()) return;

    setErrorMessages([]);
    setIsPending(true);
    const result = await startConversationAction(shopSlug, body);
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
    setBody("");
    // Straight into the thread, so the first thing they see is that it sent.
    router.push({
      pathname: "/account/messages/[id]",
      params: { id: result.conversation!.id },
    });
  }

  return (
    <>
      <Button className={className} variant="outline" onPress={() => setIsOpen(true)}>
        {t("contactShop")}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{t("contactHeading", { shop: shopName })}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="flex flex-col gap-3">
                  {/* Signed out, sending is impossible — say so before they
                      type a paragraph and lose it. */}
                  {!user && (
                    <div className="rounded-lg bg-selected p-3 text-sm text-muted">
                      {t("signInToMessage")}
                    </div>
                  )}

                  {errorMessages.length > 0 && (
                    <div className="rounded-lg bg-danger-soft p-3 text-sm text-danger-soft-foreground">
                      {errorMessages.map((message) => (
                        <p key={message}>{message}</p>
                      ))}
                    </div>
                  )}

                  <TextField
                    aria-label={t("contactHeading", { shop: shopName })}
                    isDisabled={isPending || !user}
                    value={body}
                    onChange={setBody}
                  >
                    <TextArea
                      className="border border-border"
                      rows={5}
                      placeholder={t("contactPlaceholder")}
                    />
                  </TextField>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" isDisabled={isPending} onPress={() => setIsOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button
                  isPending={isPending}
                  isDisabled={!user || body.trim().length === 0}
                  onPress={send}
                >
                  {({ isPending: pending }) => (
                    <>
                      {pending && <Spinner color="current" size="sm" />}
                      {t("send")}
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
