"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { MapPin, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { VILLAGE } from "@/lib/constants";

export interface LatLng {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  locale: string;
  value?: LatLng;
  onChange: (value: LatLng | undefined) => void;
}

/**
 * Inner map loaded only in the browser (Leaflet touches `window`).
 * Lazy so it never blocks first paint.
 */
const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-md border border-border bg-cream-100">
        <Spinner />
      </div>
    ),
  },
);

export function LocationPicker({
  locale,
  value,
  onChange,
}: LocationPickerProps) {
  const t = useTranslations("register");
  const [mounted, setMounted] = useState(false);

  const center = useMemo<LatLng>(
    () => value ?? { lat: VILLAGE.lat, lng: VILLAGE.lng },
    [value],
  );

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <MapPin className="size-4 text-primary" aria-hidden />
        <span className="text-sm font-medium text-foreground">
          {t("dropPin")}
        </span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{t("dropPinHint")}</p>

      <div className="overflow-hidden rounded-md border border-border">
        {!mounted ? (
          <button
            type="button"
            onClick={() => setMounted(true)}
            className="flex h-64 w-full flex-col items-center justify-center gap-2 bg-cream-100 text-sm font-medium text-primary transition-colors hover:bg-cream-200"
          >
            <MapPin className="size-6" aria-hidden />
            Open the map
          </button>
        ) : (
          <LeafletMap
            center={center}
            zoom={VILLAGE.zoom}
            marker={value ?? null}
            onPick={(p) => onChange(p)}
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        {value ? (
          <p className="text-sm font-medium text-forest-700">
            {t("pinSet")} — {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
        ) : (
          <span className="text-sm text-muted-foreground">
            No pin yet
          </span>
        )}

        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
            Clear pin
          </button>
        )}
      </div>
    </div>
  );
}
