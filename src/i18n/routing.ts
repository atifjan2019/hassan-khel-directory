import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/constants";

export const routing = defineRouting({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  // Always prefix so RTL/LTR is unambiguous and pages are cacheable per locale.
  localePrefix: "always",
  localeDetection: true,
});
