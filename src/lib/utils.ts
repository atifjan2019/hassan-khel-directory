import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/constants";
import { RTL_LOCALES } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}

export function dir(locale: string): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}

/** Pick the localized field, gracefully falling back to the other script. */
export function localized(
  locale: string,
  en: string | null | undefined,
  ur: string | null | undefined,
): string {
  if (locale === "ur") return (ur || en || "").trim();
  return (en || ur || "").trim();
}

/** Full display name with optional honorific, in the active locale. */
export function displayName(
  locale: string,
  p: {
    honorific?: string | null;
    full_name_en: string;
    full_name_ur?: string | null;
  },
): string {
  const base = localized(locale, p.full_name_en, p.full_name_ur);
  return p.honorific ? `${p.honorific} ${base}`.trim() : base;
}

const GREGORIAN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const GREGORIAN_UR = new Intl.DateTimeFormat("ur-PK", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(date: string | Date, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return (locale === "ur" ? GREGORIAN_UR : GREGORIAN).format(d);
}

/** Slugify for accessible anchors / share URLs. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

/** Public URL for a Storage object path. */
export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "village-media";
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
