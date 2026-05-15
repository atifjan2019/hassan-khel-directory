"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import type { VillageMapProps } from "./village-map";

/**
 * Client boundary that lazy-loads Leaflet. `ssr: false` keeps the heavy map
 * bundle (and `window`-dependent Leaflet) out of the server render and first
 * paint; the page itself stays a Server Component.
 */
const VillageMap = dynamic(() => import("./village-map"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[78dvh] min-h-[460px] w-full items-center justify-center rounded-lg border border-border bg-muted/40"
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-7" />
    </div>
  ),
});

export function VillageMapLazy(props: VillageMapProps) {
  return <VillageMap {...props} />;
}
