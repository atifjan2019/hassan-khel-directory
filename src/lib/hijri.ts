/**
 * Hijri (Islamic) date formatting using the built-in Intl Islamic calendar —
 * no extra dependency. Used alongside Gregorian dates on news posts.
 */

const HIJRI_EN = new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatHijri(date: string | Date, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  try {
    const s = HIJRI_EN.format(d);
    return `${s} AH`;
  } catch {
    return "";
  }
}
