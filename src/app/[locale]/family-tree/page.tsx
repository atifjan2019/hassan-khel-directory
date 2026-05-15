import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Network } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { getFamilyTreeNodes } from "@/lib/queries";
import { FamilyTreeLazy } from "@/features/family-tree/family-tree-lazy";
import type { FamilyTreeRow } from "@/features/family-tree/layout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("familyTreeTitle") };
}

export default async function FamilyTreePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations("familyTree");

  const rawNodes = (await getFamilyTreeNodes()) as FamilyTreeRow[];
  const focus = sp.focus?.trim() || undefined;

  return (
    <div className="container-page">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} centered />

      <div className="mt-8">
        {rawNodes.length === 0 ? (
          <EmptyState icon={Network} title={t("noData")} />
        ) : (
          <FamilyTreeLazy
            rawNodes={rawNodes}
            locale={locale}
            initialFocusId={focus}
          />
        )}
      </div>
    </div>
  );
}
