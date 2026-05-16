import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Users, Newspaper, Images, Flower2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/shared/section-heading";
import { ProfileCard } from "@/components/shared/profile-card";
import { PrayerTimes } from "@/components/shared/prayer-times";
import { HomeHero } from "@/features/home/hero";
import { StatCard } from "@/features/home/stat-card";
import { NewsTeaser } from "@/features/home/news-teaser";
import { ProfessionBars } from "@/features/home/profession-bars";
import { getStats, getRecentMembers, getNews } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  // Title omitted: the layout's `title.default` already is the site name,
  // so setting it here would double it via the title template.
  return pageMetadata({
    description: t("homeDescription"),
    path: "/",
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stats, members, news] = await Promise.all([
    getStats(),
    getRecentMembers(8),
    getNews({ limit: 3 }),
  ]);

  const t = await getTranslations("home");

  const statItems = [
    { label: t("statMembers"), value: stats?.total_members ?? 0, icon: Users },
    { label: t("statDeceased"), value: stats?.deceased ?? 0, icon: Flower2 },
    { label: t("statNews"), value: stats?.news_count ?? 0, icon: Newspaper },
    { label: t("statAlbums"), value: stats?.album_count ?? 0, icon: Images },
  ];

  const hasProfessions =
    !!stats?.by_profession &&
    Object.values(stats.by_profession).some((c) => c > 0);

  return (
    <>
      <HomeHero locale={locale} />

      <div className="container mx-auto space-y-20 px-4 py-16 sm:py-20">
        {/* ── Stats + Prayer times ──────────────────────────────────── */}
        <section aria-labelledby="stats-heading">
          <SectionHeading title={t("statsTitle")} centered />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:col-span-2">
              {statItems.map((s) => (
                <StatCard
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  icon={s.icon}
                />
              ))}
            </div>
            <div className="lg:col-span-1">
              <PrayerTimes locale={locale} />
            </div>
          </div>
        </section>

        {/* ── Latest announcements ──────────────────────────────────── */}
        <section aria-labelledby="news-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title={t("recentNews")} />
            <Link
              href="/news"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("viewAllNews")} &rarr;
            </Link>
          </div>
          <div className="mt-8">
            {news.length > 0 ? (
              <NewsTeaser posts={news} locale={locale} />
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
                No announcements yet.
              </p>
            )}
          </div>
        </section>

        <div aria-hidden="true" className="geo-divider" />

        {/* ── Newest members ────────────────────────────────────────── */}
        <section aria-labelledby="members-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title={t("recentMembers")} />
            <Link
              href="/directory"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("viewAllMembers")} &rarr;
            </Link>
          </div>
          <div className="mt-8">
            {members.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {members.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    locale={locale}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
                No members registered yet.
              </p>
            )}
          </div>
        </section>

        {/* ── Professions breakdown ─────────────────────────────────── */}
        {hasProfessions && stats && (
          <>
            <div aria-hidden="true" className="geo-divider" />
            <section aria-labelledby="professions-heading">
              <SectionHeading title={t("professionBreakdown")} />
              <div className="card-paper mt-8 p-6 sm:p-8">
                <ProfessionBars byProfession={stats.by_profession} />
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
