"use client";

import "leaflet/dist/leaflet.css";

import { type RefObject, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/shared/avatar";
import type { PublicProfile } from "@/lib/database.types";
import { VILLAGE } from "@/lib/constants";
import { displayName } from "@/lib/utils";

export interface VillageMapProps {
  profiles: PublicProfile[];
  locale: string;
  /** Optional member id (from ?focus=) to fly to and open on mount. */
  focusId?: string;
}

/** Only profiles that actually carry a usable pin. */
type PinnedProfile = PublicProfile & { latitude: number; longitude: number };

const VILLAGE_CENTER: L.LatLngExpression = [VILLAGE.lat, VILLAGE.lng];

/**
 * Custom forest-green teardrop pin rendered as an inline SVG divIcon so the
 * map needs no external marker images and stays on-palette.
 */
const PIN_SVG = `
<svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.6 12 36 12 36s12-15.4 12-24.1C24 5.3 18.6 0 12 0z" fill="hsl(154 42% 18%)"/>
  <path d="M12 1.5C6.2 1.5 1.5 6.1 1.5 11.9c0 7.4 9.3 19.7 10.5 21.3 1.2-1.6 10.5-13.9 10.5-21.3C22.5 6.1 17.8 1.5 12 1.5z" fill="none" stroke="hsl(41 56% 51%)" stroke-width="1"/>
  <circle cx="12" cy="12" r="4.4" fill="hsl(40 44% 96%)"/>
</svg>`;

function createPin(): L.DivIcon {
  return L.divIcon({
    className: "village-pin",
    html: PIN_SVG,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -40],
  });
}

/** Stable shared icon instance — divIcons are immutable so one is enough. */
const villagePin = createPin();

/** Imperatively flies the map back to the village centre. */
function RecenterControl({ label }: { label: string }) {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar !m-3 !border-border">
        <button
          type="button"
          onClick={() =>
            map.flyTo(VILLAGE_CENTER, VILLAGE.zoom, { duration: 0.75 })
          }
          className="flex items-center gap-1.5 rounded-md bg-card px-3 py-2 text-xs font-medium text-forest-700 shadow-card transition-colors hover:bg-primary/5"
          aria-label={label}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="10" r="3" />
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
          </svg>
          <span>{label}</span>
        </button>
      </div>
    </div>
  );
}

/** Pans/zooms to a focused member and opens their popup once on mount. */
function FocusController({
  target,
  markerRef,
}: {
  target: { lat: number; lng: number } | null;
  markerRef: RefObject<L.Marker | null>;
}) {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !target) return;
    done.current = true;
    const targetZoom = Math.max(VILLAGE.zoom, 17);
    map.flyTo([target.lat, target.lng], targetZoom, { duration: 0.9 });
    // Open after the fly animation; read the ref lazily so the marker
    // (populated by its callback ref on mount) is available.
    const t = window.setTimeout(() => markerRef.current?.openPopup(), 950);
    return () => window.clearTimeout(t);
  }, [target, markerRef, map]);

  return null;
}

export default function VillageMap({
  profiles,
  locale,
  focusId,
}: VillageMapProps) {
  const t = useTranslations("map");
  const tCommon = useTranslations("common");
  const tProf = useTranslations("options.profession");

  const pinned = useMemo<PinnedProfile[]>(
    () =>
      profiles.filter(
        (p): p is PinnedProfile =>
          typeof p.latitude === "number" &&
          typeof p.longitude === "number",
      ),
    [profiles],
  );

  // Keep a handle to the focused marker so FocusController can open its popup.
  const focusMarkerRef = useRef<L.Marker | null>(null);
  const focusProfile = focusId
    ? pinned.find((p) => p.id === focusId)
    : undefined;

  const focusTarget = focusProfile
    ? { lat: focusProfile.latitude, lng: focusProfile.longitude }
    : null;

  return (
    <div
      className="h-[78dvh] min-h-[460px] w-full overflow-hidden rounded-lg border border-border"
      role="region"
      aria-label={t("title")}
    >
      <MapContainer
        center={VILLAGE_CENTER}
        zoom={VILLAGE.zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={19}
        />

        {pinned.map((p) => {
          const name = displayName(locale, p);
          const isFocus = p.id === focusId;
          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={villagePin}
              ref={(m) => {
                if (isFocus) focusMarkerRef.current = m;
              }}
              title={name}
            >
              <Popup>
                <div className="flex items-center gap-3" dir="auto">
                  <Avatar
                    src={p.photo_url}
                    alt={name}
                    hidden={p.hide_photo}
                    size={44}
                  />
                  <div className="min-w-0">
                    <p className="m-0 truncate font-display text-sm font-medium text-forest-700">
                      {name}
                    </p>
                    <p className="m-0 truncate text-xs text-muted-foreground">
                      {tProf(p.profession as never)}
                    </p>
                    <Link
                      href={`/directory/${p.id}`}
                      className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {tCommon("viewProfile")}
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <RecenterControl label={t("recenter")} />
        <FocusController target={focusTarget} markerRef={focusMarkerRef} />
      </MapContainer>
    </div>
  );
}
