import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileEditForm } from "@/features/profile/profile-edit-form";
import type { ProfileRow, ProfileStatus } from "@/lib/database.types";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

const STATUS_KEY: Record<
  ProfileStatus,
  "statusPending" | "statusApproved" | "statusRejected" | "statusDisabled"
> = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
  disabled: "statusDisabled",
};

const STATUS_STYLE: Record<ProfileStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-forest-100 text-forest-700",
  rejected: "bg-destructive/10 text-destructive",
  disabled: "bg-secondary/15 text-terracotta-700",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user } = await requireUser(locale, "/profile");

  const t = await getTranslations("profilePage");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  const profile = (data as ProfileRow | null) ?? null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {!profile ? (
        <EmptyState
          icon={UserPlus}
          title={t("notLinked")}
          description={t("notLinkedBody")}
          action={
            <Button asChild>
              <Link href="/register">
                Register
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div
            role="status"
            className={`rounded-md px-4 py-3 text-sm font-medium ${STATUS_STYLE[profile.status]}`}
          >
            {t(STATUS_KEY[profile.status])}
            {profile.status === "rejected" && profile.rejection_reason ? (
              <span className="mt-1 block font-normal opacity-90">
                {profile.rejection_reason}
              </span>
            ) : null}
          </div>

          <Card>
            <CardContent className="p-5 sm:p-6">
              <ProfileEditForm profile={profile} locale={locale} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
