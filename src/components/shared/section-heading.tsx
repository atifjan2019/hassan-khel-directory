import { cn } from "@/lib/utils";

/** Display heading framed by the gold geometric rule. */
export function SectionHeading({
  title,
  subtitle,
  className,
  centered,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
}) {
  return (
    <div className={cn(centered && "text-center", className)}>
      <div className="geo-rule mb-3">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold-600">
          ✦
        </span>
      </div>
      <h2 className="text-3xl sm:text-4xl">{title}</h2>
      {subtitle && (
        <p
          className={cn(
            "mt-2 text-muted-foreground",
            centered && "mx-auto max-w-2xl",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
