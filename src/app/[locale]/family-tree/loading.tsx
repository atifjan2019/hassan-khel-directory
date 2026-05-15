import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/** Streamed fallback so the family-tree route paints fast on slow networks. */
export default function FamilyTreeLoading() {
  return (
    <div className="container-page">
      {/* Heading placeholder */}
      <div className="flex flex-col items-center">
        <Skeleton className="mb-3 h-px w-40" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>

      {/* Canvas placeholder at the real tree height */}
      <div
        className="mt-8 flex h-[75dvh] min-h-[480px] w-full items-center justify-center rounded-xl border border-cream-300 bg-cream-50"
        role="status"
        aria-live="polite"
      >
        <Spinner className="size-7" />
      </div>
    </div>
  );
}
