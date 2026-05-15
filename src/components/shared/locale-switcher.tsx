"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Toggles between Urdu and English, preserving the current route + query.
 * Reads the query string lazily on click (window.location) so it needs no
 * useSearchParams() hook — keeping every page free of CSR-bailout/Suspense.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const target = locale === "ur" ? "en" : "ur";

  function switchLocale() {
    const query =
      typeof window !== "undefined"
        ? Object.fromEntries(new URLSearchParams(window.location.search))
        : {};
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- next-intl typed routes accept dynamic params
        { pathname, params, query },
        { locale: target },
      );
    });
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      disabled={isPending}
      aria-label={target === "ur" ? "اردو میں دیکھیں" : "View in English"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 disabled:opacity-60",
        className,
      )}
    >
      <Languages className="size-4" />
      {target === "ur" ? "اردو" : "English"}
    </button>
  );
}
