import { getTranslations } from "next-intl/server";
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
        <h1 className="text-xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subheading")}</p>
      </div>

      <ProfileForm fullName={user.fullName} locale={user.locale} />
      <EmailForm email={user.email} />
      <PasswordForm />
      <CloseAccount />
    </div>
  );
}
