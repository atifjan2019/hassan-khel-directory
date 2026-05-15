import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible checkbox built on a native input (no JS dependency). */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode }
>(({ className, label, id, ...props }, ref) => {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-start gap-2.5 text-sm"
    >
      <span className="relative mt-0.5 inline-flex">
        <input
          id={inputId}
          ref={ref}
          type="checkbox"
          className={cn(
            "peer size-5 shrink-0 appearance-none rounded border border-input bg-card transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          {...props}
        />
        <Check className="pointer-events-none absolute inset-0 m-auto size-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" />
      </span>
      {label && <span className="leading-snug">{label}</span>}
    </label>
  );
});
Checkbox.displayName = "Checkbox";
