import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPinOff } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { VillageMapLazy } from "@/features/map/village-map-lazy";
import { getMappedProfiles } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("mapTitle") };
}

export default async function MapPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const focusId = sp.focus?.trim() || undefined;

  const t = await getTranslations("map");
  const profiles = await getMappedProfiles();
  const count = profiles.length;

  return (
    <div className="container-page">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} centered />

      <p
        className="mt-3 text-center text-sm text-muted-foreground"
        aria-live="polite"
      >
        {t("membersHere", { count })}
      </p>

      <div className="mt-8">
        <VillageMapLazy
          profiles={profiles}
          locale={locale}
          focusId={focusId}
        />

        {count === 0 && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPinOff className="size-4 shrink-0" aria-hidden="true" />
            {t("noLocation")}
          </p>
        )}
      </div>
    </div>
  );
}
