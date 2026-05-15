import { setRequestLocale, getTranslations } from "next-intl/server";
import { Clock, Users, Newspaper, Images, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import { getStats } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);

  const t = await getTranslations("admin.overview");
  const tAdmin = await getTranslations("admin");
  const stats = await getStats();

  const cards = [
    {
      label: t("pendingCount"),
      value: stats?.pending ?? 0,
      icon: Clock,
      tone: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: t("totalMembers"),
      value: stats?.total_members ?? 0,
      icon: Users,
      tone: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("totalNews"),
      value: stats?.news_count ?? 0,
      icon: Newspaper,
      tone: "text-gold-600",
      bg: "bg-accent/20",
    },
    {
      label: t("totalAlbums"),
      value: stats?.album_count ?? 0,
      icon: Images,
      tone: "text-forest-700",
      bg: "bg-forest-100",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl">{tAdmin("title")}</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone, bg }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-3 p-5">
              <span
                className={`inline-flex size-10 items-center justify-center rounded-lg ${bg}`}
              >
                <Icon className={`size-5 ${tone}`} />
              </span>
              <div>
                <p className="font-display text-3xl leading-none text-forest-700">
                  {value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/pending">
            {t("quickPending")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/admin/news">{t("quickNews")}</Link>
        </Button>
        <Button variant="accent" asChild>
          <Link href="/admin/albums">{t("quickAlbum")}</Link>
        </Button>
      </div>
    </div>
  );
}
