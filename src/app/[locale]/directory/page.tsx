import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/shared/section-heading";
import { ProfileCard } from "@/components/shared/profile-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DirectoryFilters } from "@/features/directory/directory-filters";
import { getDirectory, getDirectoryFacets } from "@/lib/queries";
import { COMMON_CITIES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return pageMetadata({
    title: t("directoryTitle"),
    description:
      "Browse the people of Hassan Khel village — search residents by name, profession, qualification, city and family in this public community directory.",
    path: "/directory",
  });
}

function firstParam(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

export default async function DirectoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations("directory");

  const pageNum = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const filters = {
    q: firstParam(sp.q),
    profession: firstParam(sp.profession),
    city: firstParam(sp.city),
    houseArea: firstParam(sp.houseArea),
    qualificationLevel: firstParam(sp.qualificationLevel),
    page: pageNum,
  };

  const [{ profiles, total, page, pageSize, hasMore }, facets] =
    await Promise.all([getDirectory(filters), getDirectoryFacets()]);

  // Merge facet cities with the common destination cities, unique + sorted.
  const cities = Array.from(
    new Set<string>([...facets.cities, ...COMMON_CITIES]),
  ).sort((a, b) => a.localeCompare(b));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Preserve active filters across pagination links.
  const buildPageQuery = (target: number) => {
    const qs = new URLSearchParams();
    if (filters.q) qs.set("q", filters.q);
    if (filters.profession) qs.set("profession", filters.profession);
    if (filters.city) qs.set("city", filters.city);
    if (filters.houseArea) qs.set("houseArea", filters.houseArea);
    if (filters.qualificationLevel)
      qs.set("qualificationLevel", filters.qualificationLevel);
    if (target > 1) qs.set("page", String(target));
    const s = qs.toString();
    return s ? `/directory?${s}` : "/directory";
  };

  return (
    <div className="container-page">
      <SectionHeading
        title={t("title")}
        subtitle={t("subtitle", { count: total })}
        centered
      />

      <div className="mt-8">
        <DirectoryFilters
          locale={locale}
          cities={cities}
          houseAreas={facets.houseAreas}
        />
      </div>

      <div className="mt-8">
        {profiles.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("emptyTitle")}
            description={t("emptyBody")}
          />
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {profiles.map((p) => (
                <li key={p.id}>
                  <ProfileCard profile={p} locale={locale} />
                </li>
              ))}
            </ul>

            {total > pageSize && (
              <nav
                className="mt-10 flex items-center justify-between gap-4"
                aria-label="Pagination"
              >
                {page > 1 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPageQuery(page - 1)} rel="prev" scroll>
                      <span aria-hidden="true" className="rtl:hidden">
                        ←
                      </span>
                      <span aria-hidden="true" className="hidden rtl:inline">
                        →
                      </span>
                      Previous
                    </Link>
                  </Button>
                ) : (
                  <span
                    aria-disabled="true"
                    className="invisible select-none text-sm"
                  >
                    Previous
                  </span>
                )}

                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {`Page ${page} of ${totalPages}`}
                </p>

                {hasMore ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPageQuery(page + 1)} rel="next" scroll>
                      Next
                      <span aria-hidden="true" className="rtl:hidden">
                        →
                      </span>
                      <span aria-hidden="true" className="hidden rtl:inline">
                        ←
                      </span>
                    </Link>
                  </Button>
                ) : (
                  <span
                    aria-disabled="true"
                    className="invisible select-none text-sm"
                  >
                    Next
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
