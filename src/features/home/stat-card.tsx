import type { ComponentType } from "react";
import { Card } from "@/components/ui/card";

/** A single, dignified statistic tile for the home stats strip. */
export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="card-paper relative overflow-hidden p-5">
      <span
        aria-hidden="true"
        className="absolute -end-3 -top-3 size-16 rounded-full bg-gold-400/10"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-4xl font-semibold tabular-nums text-forest-700 sm:text-5xl">
            {value.toLocaleString()}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
        <span className="rounded-md bg-primary/5 p-2.5 text-gold-600">
          <Icon className="size-5" />
        </span>
      </div>
    </Card>
  );
}
