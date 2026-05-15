import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/** Streamed fallback so the map route paints fast before Leaflet loads. */
export default function MapLoading() {
  return (
    <div className="container-page">
      {/* Heading placeholder */}
      <div className="flex flex-col items-center">
        <Skeleton className="mb-3 h-px w-40" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-40 max-w-full" />
      </div>

      {/* Map placeholder at the live map height */}
      <div className="mt-8">
        <div
          className="flex h-[78dvh] min-h-[460px] w-full items-center justify-center rounded-lg border border-border bg-muted/40"
          role="status"
          aria-live="polite"
        >
          <Spinner className="size-7" />
        </div>
      </div>
    </div>
  );
}
