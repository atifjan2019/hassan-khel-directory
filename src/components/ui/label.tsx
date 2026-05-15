import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(({ className, children, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "block text-sm font-medium text-foreground mb-1.5",
      className,
    )}
    {...props}
  >
    {children}
    {required && <span className="text-destructive ms-1">*</span>}
  </label>
));
Label.displayName = "Label";
