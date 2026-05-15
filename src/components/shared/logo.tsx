import { Link } from "@/i18n/navigation";
import { VILLAGE } from "@/lib/constants";

/** Wordmark: a simple jirga-arch glyph + bilingual village name. */
export function Logo({ locale }: { locale: string }) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5"
      aria-label={VILLAGE.nameEn}
    >
      <svg
        viewBox="0 0 40 40"
        className="size-9 shrink-0 text-primary"
        aria-hidden="true"
      >
        <path
          d="M20 3 5 12v25h30V12z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M14 37V24a6 6 0 0 1 12 0v13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <circle cx="20" cy="11" r="2" fill="hsl(var(--accent))" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold text-forest-700">
          {locale === "ur" ? VILLAGE.nameUr : VILLAGE.nameEn}
        </span>
        <span className="text-[11px] tracking-wide text-muted-foreground">
          {locale === "ur" ? "گاؤں ڈائریکٹری" : "Village Directory"}
        </span>
      </span>
    </Link>
  );
}
