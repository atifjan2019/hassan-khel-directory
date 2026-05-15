import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/constants";

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  // Single locale (English): no locale prefix in the URL at all.
  // The [locale] segment still exists internally; next-intl rewrites
  // "/path" → "/en/path" so pages keep working with clean URLs.
  localePrefix: "never",
  localeDetection: false,
});
