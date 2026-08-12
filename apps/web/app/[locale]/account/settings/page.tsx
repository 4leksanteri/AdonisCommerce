import { getTranslations } from "next-intl/server";
import { AccountBackLink } from "@/components/account/back-link";
import { getCurrentUser } from "@/lib/auth/queries";
import { ProfileForm } from "@/components/account/profile-form";
import { EmailForm } from "@/components/account/email-form";
import { PasswordForm } from "@/components/account/password-form";
import { CloseAccount } from "@/components/account/close-account";

export default async function AccountSettingsPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("Account.settings")]);

  // Signed out, the layout shows the sign-in prompt in place of this.
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        {/* Inside the heading block, not a sibling in the gap-6 stack — a
            back link belongs to the title it returns from, and 24px of air
            reads as two unrelated things. */}
        <AccountBackLink />
        <h1 className="mt-1.5 text-[22px] font-bold tracking-tight text-foreground md:mt-0 md:text-2xl">
          {t("heading")}
        </h1>
        <p className="mt-1 text-[13px] text-muted md:text-sm">{t("subheading")}</p>
      </div>

      <ProfileForm fullName={user.fullName} locale={user.locale} />
      <EmailForm email={user.email} />
      <PasswordForm />
      <CloseAccount />
    </div>
  );
}
