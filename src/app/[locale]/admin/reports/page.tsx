import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { getStats } from "@/lib/queries";
import { PROFESSIONS, type Profession } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { ExportButton } from "@/features/admin/export-button";

function isProfession(k: string): k is Profession {
  return (PROFESSIONS as readonly string[]).includes(k);
}

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);

  const t = await getTranslations("admin.reports");
  const tProf = await getTranslations("options.profession");
  const stats = await getStats();

  const professions = Object.entries(stats?.by_profession ?? {}).sort(
    (a, b) => b[1] - a[1],
  );
  const maxProf = professions.reduce((m, [, c]) => Math.max(m, c), 0);

  const cities = (stats?.by_city ?? []).slice();
  const maxCity = cities.reduce((m, c) => Math.max(m, c.c), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">{t("title")}</h1>
        <ExportButton />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-3xl text-forest-700">
              {stats?.total_members ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("memberCount")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-3xl text-secondary">
              {stats?.pending ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("pendingBreakdown")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-3xl text-charcoal">
              {stats?.deceased ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("deceasedCount")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-3xl text-gold-600">
              {stats?.news_count ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {"Announcements"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-display text-xl text-forest-700">
              {t("professionBreakdown")}
            </h2>
            {professions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              professions.map(([key, count]) => (
                <Bar
                  key={key}
                  label={isProfession(key) ? tProf(key) : key}
                  value={count}
                  max={maxProf}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-display text-xl text-forest-700">
              {t("cityBreakdown")}
            </h2>
            {cities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              cities.map((c) => (
                <Bar
                  key={c.city}
                  label={c.city}
                  value={c.c}
                  max={maxCity}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
