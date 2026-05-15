import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";

/**
 * Respectful "Marhoom" (departed) marker. Tooltip carries the dua
 * "May Allah grant them Jannah — Inna lillahi wa inna ilayhi raji'un".
 */
export async function MarhoomBadge() {
  const t = await getTranslations("profile");
  return (
    <Badge
      variant="outline"
      className="border-gold-500/40 bg-cream-50 text-gold-600"
      title={t("marhoomTooltip")}
    >
      {t("marhoom")}
    </Badge>
  );
}
