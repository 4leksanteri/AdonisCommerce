import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage(props: PageProps<"/[locale]/reset-password">) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : null;
  const email = typeof searchParams.email === "string" ? searchParams.email : null;
  const t = await getTranslations("ResetPasswordPage");

  return (
    <main className="flex flex-1 items-center justify-center py-16">
      <Container className="max-w-sm">
        <h1 className="mb-6 text-center text-xl font-semibold text-foreground">{t("heading")}</h1>

        {token && email ? (
          <ResetPasswordForm email={email} token={token} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-card bg-danger-soft p-3 text-sm text-danger-soft-foreground">
              <p>{t("invalidLink")}</p>
            </div>
            <Link href="/" className="text-center text-sm font-medium text-foreground underline">
              {t("backToHome")}
            </Link>
          </div>
        )}
      </Container>
    </main>
  );
}
