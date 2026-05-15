import { getTranslations } from "next-intl/server";
import { Heart, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { VILLAGE } from "@/lib/constants";

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-forest-800 text-cream-100">
      <div className="geo-divider opacity-40" />
      <div className="container mx-auto grid gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl text-cream-50">
            {VILLAGE.nameEn}
          </h3>
          <p className="mt-1 text-sm text-cream-200/80">
            {VILLAGE.districtEn}
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-200/70">
            {t("tagline")}
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-400">
            {t("quickLinks")}
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-cream-200/80 transition-colors hover:text-cream-50"
                >
                  {tn(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-400">
            <ShieldCheck className="size-4" />
            Privacy
          </h4>
          <p className="text-sm leading-relaxed text-cream-200/70">
            {t("privacyNote")}
          </p>
        </div>
      </div>

      <div className="border-t border-cream-50/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-cream-200/60 sm:flex-row">
          <p>
            © {year} {t("rights")}
          </p>
          <p className="flex items-center gap-1.5">
            {t("madeWith")} <Heart className="size-3.5 text-terracotta-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
