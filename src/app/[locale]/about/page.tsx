import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { VILLAGE } from "@/lib/constants";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const isUr = locale === "ur";

  const sections = [
    { title: t("historyTitle"), body: t("historyBody") },
    { title: t("purposeTitle"), body: t("purposeBody") },
    { title: t("privacyTitle"), body: t("privacyBody") },
  ];

  return (
    <div className="container-page">
      <div className="mx-auto max-w-3xl">
        <SectionHeading title={t("title")} centered />

        {/* Bilingual village identity */}
        <div className="mt-8 text-center">
          <p className="font-nastaliq text-3xl leading-[1.6] text-forest-700 sm:text-4xl">
            {VILLAGE.nameUr}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-forest-700 sm:text-3xl">
            {VILLAGE.nameEn}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isUr ? VILLAGE.districtUr : VILLAGE.districtEn}
          </p>
        </div>

        <div className="geo-rule mx-auto mt-8 max-w-sm">
          <span className="text-gold-600">&#10022;</span>
        </div>

        <div className="prose-village mt-8 text-lg">
          <p>{t("intro")}</p>
        </div>

        {sections.map((s) => (
          <section key={s.title} className="mt-2">
            <div aria-hidden="true" className="geo-divider my-10" />
            <h2 className="font-display text-2xl text-forest-700">{s.title}</h2>
            <div className="prose-village mt-3">
              <p>{s.body}</p>
            </div>
          </section>
        ))}

        {/* Contact the admins */}
        <div aria-hidden="true" className="geo-divider my-10" />
        <section className="card-paper p-6 sm:p-8">
          <h2 className="font-display text-2xl text-forest-700">
            {t("contactTitle")}
          </h2>
          <div className="prose-village mt-3">
            <p>{t("contactBody")}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href="/register">
                {isUr ? "اندراج کریں" : "Register a member"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">
                {isUr ? "منتظمین لاگ ان" : "Admin log in"}
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
