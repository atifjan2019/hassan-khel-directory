import { setRequestLocale, getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/ui/empty-state";
import { PendingList } from "@/features/admin/pending-list";
import type { ProfileRow } from "@/lib/database.types";

export default async function AdminPendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);

  const t = await getTranslations("admin.pending");

  // Service-role read so pending rows + phone/email are visible to admins.
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const profiles = (data ?? []) as ProfileRow[];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl">{t("title")}</h1>

      {profiles.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={t("empty")} />
      ) : (
        <PendingList profiles={profiles} locale={locale} />
      )}
    </div>
  );
}
