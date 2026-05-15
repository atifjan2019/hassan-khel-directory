import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/constants";

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  // Single locale (English). Always-prefix keeps URLs at /en/… and pages
  // cacheable; detection is moot with one locale.
  localePrefix: "always",
  localeDetection: false,
});
