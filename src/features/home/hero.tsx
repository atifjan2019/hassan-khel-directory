import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { VILLAGE } from "@/lib/constants";

/** Subtle Pashtun-textile inspired geometric motif (decorative only). */
function GeoMotif({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.6">
        <path d="M60 4 116 60 60 116 4 60Z" />
        <path d="M60 24 96 60 60 96 24 60Z" />
        <path d="M60 44 76 60 60 76 44 60Z" />
        <path d="M4 60h112M60 4v112" />
      </g>
    </svg>
  );
}

export async function HomeHero({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  const isUr = locale === "ur";

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-cream-50 via-cream-100 to-background">
      {/* Soft paper-texture wash + warm vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-paper-texture bg-paper opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent"
      />
      {/* Decorative motifs, tucked into the corners, RTL-safe via logical inset */}
      <GeoMotif className="pointer-events-none absolute -end-10 -top-8 -z-10 size-56 text-gold-500/25 sm:size-72" />
      <GeoMotif className="pointer-events-none absolute -bottom-12 -start-10 -z-10 size-48 text-forest-700/10 sm:size-64" />

      <div className="container mx-auto px-4 py-20 text-center sm:py-28">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-gold-600">
          {t("heroKicker")}
        </p>

        <h1 className="mt-5 flex flex-col items-center gap-2">
          <span className="font-nastaliq text-5xl leading-[1.5] text-forest-700 sm:text-7xl">
            {VILLAGE.nameUr}
          </span>
          <span className="font-display text-4xl font-semibold tracking-tight text-forest-700 sm:text-6xl">
            {VILLAGE.nameEn}
          </span>
        </h1>

        <div className="geo-rule mx-auto mt-6 max-w-xs">
          <span className="text-gold-600">&#10022;</span>
        </div>

        <p className="mt-5 text-base text-charcoal-muted sm:text-lg">
          {isUr ? VILLAGE.districtUr : VILLAGE.districtEn}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-charcoal/80 sm:text-lg">
          {t("heroSubtitle")}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="secondary" size="lg">
            <Link href="/directory">{t("browseDirectory")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">{t("addYourself")}</Link>
          </Button>
        </div>
      </div>

      <div aria-hidden="true" className="geo-divider" />
    </section>
  );
}
