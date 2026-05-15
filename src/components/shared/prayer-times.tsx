import { getTranslations } from "next-intl/server";
import { Sunrise, Sun, Sunset, Moon, CloudSun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VILLAGE } from "@/lib/constants";

interface Timings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const ORDER: { key: keyof Timings; label: string; icon: typeof Sun }[] = [
  { key: "Fajr", label: "Fajr", icon: Sunrise },
  { key: "Dhuhr", label: "Dhuhr", icon: Sun },
  { key: "Asr", label: "Asr", icon: CloudSun },
  { key: "Maghrib", label: "Maghrib", icon: Sunset },
  { key: "Isha", label: "Isha", icon: Moon },
];

const PRAYER_UR: Record<keyof Timings, string> = {
  Fajr: "فجر",
  Dhuhr: "ظہر",
  Asr: "عصر",
  Maghrib: "مغرب",
  Isha: "عشاء",
};

/** Server component — fetched once/day from the free Aladhan API. */
export async function PrayerTimes({ locale }: { locale: string }) {
  const t = await getTranslations("home");

  let timings: Timings | null = null;
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timings?latitude=${VILLAGE.lat}&longitude=${VILLAGE.lng}&method=1`,
      { next: { revalidate: 21600 } }, // 6h
    );
    if (res.ok) {
      const json = await res.json();
      timings = json?.data?.timings ?? null;
    }
  } catch {
    timings = null;
  }

  if (!timings) return null;

  return (
    <Card className="bg-gradient-to-br from-forest-700 to-forest-800 text-cream-50">
      <div className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="font-display text-xl text-cream-50">
            {t("prayerTitle")}
          </h3>
          <span className="text-xs text-cream-200/80">
            {t("prayerLocation")}
          </span>
        </div>
        <ul className="grid grid-cols-5 gap-2 text-center">
          {ORDER.map(({ key, label, icon: Icon }) => (
            <li
              key={key}
              className="rounded-md bg-cream-50/10 px-1 py-3 backdrop-blur-sm"
            >
              <Icon className="mx-auto mb-1.5 size-4 text-gold-400" />
              <div className="text-[11px] font-medium text-cream-100">
                {locale === "ur" ? PRAYER_UR[key] : label}
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">
                {timings[key]}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
