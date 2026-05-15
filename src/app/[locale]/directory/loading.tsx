import { Skeleton } from "@/components/ui/skeleton";

/** Streamed fallback so the directory route paints fast on slow networks. */
export default function DirectoryLoading() {
  return (
    <div className="container-page">
      {/* Heading placeholder */}
      <div className="flex flex-col items-center">
        <Skeleton className="mb-3 h-px w-40" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-48 max-w-full" />
      </div>

      {/* Filter bar placeholder */}
      <div className="card-paper mt-8 p-4 sm:p-5">
        <Skeleton className="h-11 w-full" />
        <div className="mt-4 hidden gap-3 lg:grid lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>

      {/* Grid placeholder */}
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <li key={i}>
            <div className="card-paper flex h-full flex-col items-center p-5">
              <Skeleton className="mb-3 size-[88px] rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-2 h-3.5 w-1/2" />
              <Skeleton className="mt-3 h-5 w-20 rounded-full" />
              <Skeleton className="mt-3 h-3 w-2/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
