import "server-only";

/**
 * Convert a stored news body (plain text with simple newlines, occasionally
 * containing basic HTML) into a safe, plain-text excerpt. We intentionally
 * strip any markup rather than render it, to stay XSS-safe.
 */
export function toPlainText(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(input: string | null | undefined, max = 160): string {
  const text = toPlainText(input);
  if (text.length <= max) return text;
  const sliced = text.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`;
}

/**
 * Body for the detail view: collapse any HTML to plain text but preserve
 * paragraph / line breaks so `whitespace-pre-line` renders them faithfully.
 */
export function bodyToPlainTextWithBreaks(
  input: string | null | undefined,
): string {
  if (!input) return "";
  return input
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .trim();
}
