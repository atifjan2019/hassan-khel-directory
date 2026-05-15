/**
 * Hijri (Islamic) date formatting using the built-in Intl Islamic calendar —
 * no extra dependency. Used alongside Gregorian dates on news posts.
 */

const HIJRI_EN = new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const HIJRI_UR = new Intl.DateTimeFormat("ur-PK-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatHijri(date: string | Date, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  try {
    const s = (locale === "ur" ? HIJRI_UR : HIJRI_EN).format(d);
    return locale === "ur" ? `${s} ھ` : `${s} AH`;
  } catch {
    return "";
  }
}
