/**
 * Renders a JSON-LD structured-data block. The payload is built by our own
 * helpers in `@/lib/seo` (never user input), so serialising it is safe.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
