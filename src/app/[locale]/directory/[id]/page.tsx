import type { Metadata } from "next";
import {
  GraduationCap,
  MapPin,
  Home,
  CalendarDays,
  Briefcase,
  Network,
  Map as MapIcon,
  Lock,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/shared/avatar";
import { MarhoomBadge } from "@/components/shared/marhoom-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { getProfileById, getChildren } from "@/lib/queries";
import { displayName, localized, formatDate, storageUrl } from "@/lib/utils";
import { JsonLd } from "@/components/shared/json-ld";
import { pageMetadata, personJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id?: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  const profile = id ? await getProfileById(id) : null;
  if (!profile)
    return pageMetadata({
      title: t("notFound"),
      path: "/directory",
      noindex: true,
    });

  const name = displayName(locale, profile);
  const tProf = await getTranslations({
    locale,
    namespace: "options.profession",
  });
  const profession = tProf(profile.profession as never);
  // Never expose a photo the member chose to hide.
  const photo =
    !profile.hide_photo && profile.photo_url
      ? (storageUrl(profile.photo_url) ?? undefined)
      : undefined;

  return pageMetadata({
    title: name,
    description: `${name} — ${profession} from Hassan Khel village. View profile, lineage and family connections in the community directory.`,
    path: `/directory/${profile.id}`,
    type: "profile",
    image: photo,
  });
}

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id?: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("profile");
  const tProf = await getTranslations("options.profession");
  const tQual = await getTranslations("options.qualification");
  const tCommon = await getTranslations("common");

  const profile = id ? await getProfileById(id) : null;

  if (!profile) {
    return (
      <div className="container-page">
        <div className="mx-auto max-w-xl">
          <EmptyState
            icon={Lock}
            title={t("notFound")}
            description={t("notFoundBody")}
            action={
              <Button variant="outline" asChild>
                <Link href="/directory">{tCommon("back")}</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const name = displayName(locale, profile);
  const fatherName = localized(locale, profile.father_name_en);
  const grandfatherName = localized(locale, profile.grandfather_name_en);
  const bio = localized(locale, profile.bio_en);
  const qualification = profile.qualification?.trim();
  const institute = profile.institute?.trim();

  const [father, children] = await Promise.all([
    profile.father_profile_id
      ? getProfileById(profile.father_profile_id)
      : Promise.resolve(null),
    getChildren(profile.id),
  ]);

  const hasMap =
    profile.latitude != null && profile.longitude != null;

  const facts: { icon: typeof MapPin; label: string; value: string }[] = [];
  facts.push({
    icon: Briefcase,
    label: t("profession"),
    value: tProf(profile.profession as never),
  });
  if (profile.qualification_level) {
    facts.push({
      icon: GraduationCap,
      label: t("qualification"),
      value: tQual(profile.qualification_level as never),
    });
  }
  if (institute) {
    facts.push({
      icon: GraduationCap,
      label: t("institute"),
      value: qualification ? `${qualification} · ${institute}` : institute,
    });
  } else if (qualification) {
    facts.push({
      icon: GraduationCap,
      label: t("qualification"),
      value: qualification,
    });
  }
  if (profile.current_city) {
    facts.push({
      icon: MapPin,
      label: t("currentCity"),
      value: profile.current_city,
    });
  }
  if (profile.house_area) {
    facts.push({
      icon: Home,
      label: t("houseArea"),
      value: profile.house_area,
    });
  }
  if (profile.date_of_birth) {
    facts.push({
      icon: CalendarDays,
      label: t("dateOfBirth"),
      value: formatDate(profile.date_of_birth, locale),
    });
  }

  return (
    <div className="container-page">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/directory">
            <span aria-hidden="true" className="rtl:hidden">
              ←
            </span>
            <span aria-hidden="true" className="hidden rtl:inline">
              →
            </span>
            {tCommon("back")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Side: photo + key facts */}
        <aside className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-center p-6 pt-6 text-center">
              <Avatar
                src={profile.photo_url}
                alt={name}
                hidden={profile.hide_photo}
                size={160}
                className="mb-4"
              />
              <h1 className="font-display text-2xl leading-tight text-forest-700">
                {name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge>{tProf(profile.profession as never)}</Badge>
                {profile.is_deceased && <MarhoomBadge />}
              </div>
            </CardContent>

            <Separator />

            <CardContent className="p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("sonOf")}
                  </dt>
                  <dd className="mt-0.5 text-sm text-foreground">
                    {fatherName}
                  </dd>
                </div>
                {grandfatherName && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("grandsonOf")}
                    </dt>
                    <dd className="mt-0.5 text-sm text-foreground">
                      {grandfatherName}
                    </dd>
                  </div>
                )}
                {facts.map((f) => (
                  <div key={f.label} className="flex items-start gap-2.5">
                    <f.icon className="mt-0.5 size-4 shrink-0 text-primary/70" />
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {f.label}
                      </dt>
                      <dd className="mt-0.5 text-sm text-foreground">
                        {f.value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>

              <p className="mt-6 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                {t("privateNotice")}
              </p>
            </CardContent>
          </Card>
        </aside>

        {/* Main: bio + lineage + actions */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("biography")}</CardTitle>
            </CardHeader>
            <CardContent>
              {bio ? (
                <p className="prose-village whitespace-pre-line text-sm leading-relaxed">
                  {bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No biography available yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("lineage")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {t("father")}
                </h3>
                {father ? (
                  <Link
                    href={`/directory/${father.id}`}
                    className="card-paper flex items-center gap-3 p-3 transition-colors hover:bg-primary/5"
                  >
                    <Avatar
                      src={father.photo_url}
                      alt={displayName(locale, father)}
                      hidden={father.hide_photo}
                      size={48}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-display text-base text-forest-700">
                        {displayName(locale, father)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tProf(father.profession as never)}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {fatherName || "Unknown"}
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {t("children")}
                </h3>
                {children.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {children.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/directory/${c.id}`}
                          className="card-paper flex flex-col items-center gap-2 p-3 text-center transition-colors hover:bg-primary/5"
                        >
                          <Avatar
                            src={c.photo_url}
                            alt={displayName(locale, c)}
                            hidden={c.hide_photo}
                            size={56}
                          />
                          <span className="line-clamp-2 text-sm font-medium text-forest-700">
                            {displayName(locale, c)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No registered children.
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/family-tree?focus=${profile.id}`}>
                    <Network className="size-4" />
                    {t("viewInTree")}
                  </Link>
                </Button>
                {hasMap && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/map?focus=${profile.id}`}>
                      <MapIcon className="size-4" />
                      {t("viewOnMap")}
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
