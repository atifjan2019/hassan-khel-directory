import { getTranslations } from "next-intl/server";

/**
 * Horizontal proportional bar list of professions across the village.
 * Server component — sorts by count and renders forest/gold bars.
 */
export async function ProfessionBars({
  byProfession,
}: {
  byProfession: Record<string, number>;
}) {
  const tp = await getTranslations("options.profession");

  const rows = Object.entries(byProfession)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (rows.length === 0) return null;

  const max = Math.max(...rows.map(([, c]) => c));

  return (
    <ul className="space-y-3">
      {rows.map(([key, count]) => {
        const pct = max > 0 ? Math.max(6, Math.round((count / max) * 100)) : 0;
        return (
          <li key={key} className="flex items-center gap-4">
            <span className="w-32 shrink-0 truncate text-sm font-medium text-forest-700 sm:w-44">
              {tp(key as never)}
            </span>
            <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-cream-200">
              <div
                className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-forest-700 to-gold-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-end text-sm font-semibold tabular-nums text-charcoal/80">
              {count.toLocaleString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
