import Image from "next/image";
import { cn } from "@/lib/utils";
import { storageUrl } from "@/lib/utils";

/** Neutral, non-cartoon silhouette — the default per cultural guidelines. */
function Silhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
      role="img"
    >
      <rect width="64" height="64" fill="hsl(154 20% 90%)" />
      <circle cx="32" cy="25" r="11" fill="hsl(154 18% 62%)" />
      <path
        d="M12 58c1.5-12 9.5-19 20-19s18.5 7 20 19z"
        fill="hsl(154 18% 62%)"
      />
    </svg>
  );
}

export function Avatar({
  src,
  alt,
  hidden,
  size = 96,
  className,
  rounded = "full",
}: {
  src?: string | null;
  alt: string;
  hidden?: boolean;
  size?: number;
  className?: string;
  rounded?: "full" | "lg";
}) {
  const url = hidden ? null : storageUrl(src);
  const radius = rounded === "full" ? "rounded-full" : "rounded-lg";

  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden bg-muted ring-1 ring-border",
        radius,
        className,
      )}
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <Silhouette />
      )}
    </span>
  );
}
