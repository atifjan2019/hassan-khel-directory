import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/features/admin/profile-form";
import { updateProfile, type ActionResult } from "@/features/admin/actions";
import type { ProfileRow } from "@/lib/database.types";

export default async function AdminMemberEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);

  const t = await getTranslations("admin.members");

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const profile = data as ProfileRow;

  async function action(fd: FormData): Promise<ActionResult> {
    "use server";
    return updateProfile(id, fd);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">{t("editProfile")}</h1>
        <p className="mt-1 text-muted-foreground">{profile.full_name_en}</p>
      </div>
      <Card>
        <CardContent className="p-5 sm:p-6">
          <ProfileForm
            profile={profile}
            action={action}
            locale={locale}
            backHref="/admin/members"
          />
        </CardContent>
      </Card>
    </div>
  );
}
