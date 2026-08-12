"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Input,
  Label,
  NumberField,
  Spinner,
  Switch,
  TextField,
  toast,
} from "@heroui/react";
import { useRouter } from "@/i18n/navigation";
import { saveCategoryAction } from "@/lib/admin/actions";
import { translateApiErrors } from "@/lib/translate-api-error";
import type { AdminCategory } from "@/lib/admin/types";

const LOCALES = ["en", "fi"] as const;

type Draft = {
  position: number;
  isActive: boolean;
  names: Record<string, string>;
  slugs: Record<string, string>;
};

function draftFor(category: AdminCategory | null): Draft {
  const names: Record<string, string> = {};
  const slugs: Record<string, string> = {};

  for (const locale of LOCALES) {
    const translation = category?.translations.find((row) => row.locale === locale);
    names[locale] = translation?.name ?? "";
    slugs[locale] = translation?.slug ?? "";
  }

  return {
    position: category?.position ?? 0,
    isActive: category?.isActive ?? true,
    names,
    slugs,
  };
}

type EditorProps = {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  errorMessages: string[];
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
};

/**
 * Both languages edited side by side. Seeing them together is how you notice
 * one has drifted from the other — which is exactly the failure a translation
 * table invites, and the reason the API insists on every locale being present.
 */
function CategoryEditor({
  draft,
  setDraft,
  errorMessages,
  isPending,
  onSave,
  onCancel,
}: EditorProps) {
  const t = useTranslations("Admin");

  return (
    <div className="flex flex-col gap-4">
      {errorMessages.length > 0 && (
        <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      {LOCALES.map((locale) => (
        <div key={locale} className="flex flex-wrap gap-3">
          <TextField
            className="min-w-56 flex-1"
            isDisabled={isPending}
            value={draft.names[locale]}
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, names: { ...prev.names, [locale]: value } }))
            }
          >
            <Label>{t("categoryName", { locale: locale.toUpperCase() })}</Label>
            <Input className="border border-border" />
          </TextField>

          <TextField
            className="min-w-56 flex-1"
            isDisabled={isPending}
            value={draft.slugs[locale]}
            onChange={(value) =>
              setDraft((prev) => ({ ...prev, slugs: { ...prev.slugs, [locale]: value } }))
            }
          >
            <Label>{t("categorySlug", { locale: locale.toUpperCase() })}</Label>
            <Input className="border border-border" placeholder={t("categorySlugAuto")} />
          </TextField>
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-6">
        <NumberField
          minValue={0}
          isDisabled={isPending}
          value={draft.position}
          onChange={(value) =>
            setDraft((prev) => ({ ...prev, position: Number.isNaN(value) ? 0 : value }))
          }
        >
          <Label>{t("categoryPosition")}</Label>
          <NumberField.Group className="w-28">
            <NumberField.Input />
          </NumberField.Group>
        </NumberField>

        <Switch
          isDisabled={isPending}
          isSelected={draft.isActive}
          onChange={(isActive) => setDraft((prev) => ({ ...prev, isActive }))}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label>{t("categoryActive")}</Label>
          </Switch.Content>
        </Switch>
      </div>

      <div className="flex gap-2">
        <Button isPending={isPending} onPress={onSave}>
          {({ isPending: pending }) => (
            <>
              {pending && <Spinner color="current" size="sm" />}
              {t("save")}
            </>
          )}
        </Button>
        <Button variant="outline" isDisabled={isPending} onPress={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}

export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  const t = useTranslations("Admin");
  const tValidation = useTranslations("Validation");
  const tApiMessages = useTranslations("ApiMessages");
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftFor(null));
  const [isPending, setIsPending] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  function startCreate() {
    setEditingId(null);
    setIsCreating(true);
    setDraft(draftFor(null));
    setErrorMessages([]);
  }

  function startEdit(category: AdminCategory) {
    setIsCreating(false);
    setEditingId(category.id);
    setDraft(draftFor(category));
    setErrorMessages([]);
  }

  function cancel() {
    setIsCreating(false);
    setEditingId(null);
    setErrorMessages([]);
  }

  async function save() {
    setErrorMessages([]);
    setIsPending(true);

    const result = await saveCategoryAction(isCreating ? null : editingId, {
      position: draft.position,
      isActive: draft.isActive,
      translations: LOCALES.map((locale) => ({
        locale,
        name: draft.names[locale],
        // Blank means "derive it from the name", which the API does with the
        // same slugify that folds ä and ö.
        slug: draft.slugs[locale].trim() || undefined,
      })),
    });
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

    setIsCreating(false);
    setEditingId(null);
    toast.success(t("categorySaved"));
    router.refresh();
  }

  const editorProps = {
    draft,
    setDraft,
    errorMessages,
    isPending,
    onSave: save,
    onCancel: cancel,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col divide-y divide-border rounded-card border border-border">
        {categories.map((category) => {
          const en = category.translations.find((row) => row.locale === "en");
          const fi = category.translations.find((row) => row.locale === "fi");

          /**
           * The editor opens in the row itself rather than at the foot of the
           * list. With a taxonomy this long the form was landing below the
           * fold, so pressing Edit looked like it had done nothing at all.
           */
          if (editingId === category.id) {
            return (
              <div key={category.id} className="bg-surface p-4">
                <CategoryEditor {...editorProps} />
              </div>
            );
          }

          return (
            <div key={category.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {en?.name} <span className="font-normal text-muted">· {fi?.name}</span>
                </p>
                <p className="truncate text-sm text-muted">
                  /{en?.slug} · /{fi?.slug}
                </p>
                <p className="text-xs text-muted">
                  {t("categoryProducts", { count: category.productCount })}
                  {!category.isActive && ` · ${t("categoryHidden")}`}
                </p>
              </div>
              <Button variant="outline" isDisabled={isPending} onPress={() => startEdit(category)}>
                {t("edit")}
              </Button>
            </div>
          );
        })}
      </div>

      {isCreating ? (
        <div className="rounded-card border border-border p-4">
          <CategoryEditor {...editorProps} />
        </div>
      ) : (
        <Button variant="outline" className="self-start" onPress={startCreate}>
          {t("newCategory")}
        </Button>
      )}
    </div>
  );
}
