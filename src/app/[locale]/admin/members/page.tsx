import { setRequestLocale, getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/ui/empty-state";
import { MembersTable } from "@/features/admin/members-table";
import type { ProfileRow } from "@/lib/database.types";

export default async function AdminMembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);

  const t = await getTranslations("admin.members");

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const profiles = (data ?? []) as ProfileRow[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">{t("title")}</h1>

      {profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title={locale === "ur" ? "کوئی رکن نہیں" : "No members yet"}
        />
      ) : (
        <MembersTable profiles={profiles} locale={locale} />
      )}
    </div>
  );
}
