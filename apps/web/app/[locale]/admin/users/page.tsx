import { getFormatter, getTranslations } from "next-intl/server";
import { Chip } from "@heroui/react";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { getAdminUsers, requireAdmin } from "@/lib/admin/queries";

export default async function AdminUsersPage(props: PageProps<"/[locale]/admin/users">) {
  const { locale } = await props.params;
  const me = await requireAdmin(locale);
  const { search = "", role = "all" } = await props.searchParams;

  const [users, t, format] = await Promise.all([
    getAdminUsers(String(search), String(role)),
    getTranslations("Admin"),
    getFormatter(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("usersHeading")}</h1>
        <p className="mt-1 text-sm text-muted">{t("usersSubheading")}</p>
      </div>

      {/* A plain GET form: search belongs in the URL so a filtered list can be
          shared and survives a refresh. */}
      <form className="flex flex-wrap gap-2">
        <input
          type="search"
          name="search"
          defaultValue={String(search)}
          placeholder={t("searchPlaceholder")}
          className="min-w-64 rounded-card border border-border bg-transparent px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          className="rounded-card border border-border px-3 py-2 text-sm text-foreground"
        >
          {t("search")}
        </button>
      </form>

      {users.length === 0 ? (
        <div className="rounded-card border border-border p-8 text-center text-sm text-muted">
          {t("usersEmpty")}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-card border border-border">
          {users.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{user.fullName ?? user.email}</p>
                <p className="truncate text-sm text-muted">
                  {user.email} ·{" "}
                  {format.dateTime(new Date(user.createdAt), {
                    dateStyle: "medium",
                  })}
                </p>
                {user.roleChangedBy && (
                  <p className="text-xs text-muted">
                    {t("roleSetBy", { email: user.roleChangedBy })}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {user.shop && (
                  <Chip>
                    <Chip.Label>{user.shop.name}</Chip.Label>
                  </Chip>
                )}
                <UserRoleSelect user={user} isSelf={user.id === me.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
