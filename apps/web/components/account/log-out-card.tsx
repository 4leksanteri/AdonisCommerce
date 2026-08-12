"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/context";
import { logoutAction } from "@/lib/auth/actions";

/** On the menu screen because there is no header dropdown to reach on a phone. */
export function LogOutCard() {
  const t = useTranslations("Header");
  const { setUser } = useAuth();
  const router = useRouter();

  async function logOut() {
    setUser(null);
    await logoutAction();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={logOut}
      className="w-full rounded-xl border border-border bg-surface p-4 text-left text-sm font-semibold text-danger hover:bg-row-hover"
    >
      {t("logOut")}
    </button>
  );
}
