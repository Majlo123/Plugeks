import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "accent" | "muted" | "outline";
};

const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-brand text-cream",
  accent: "bg-accent text-charcoal",
  muted: "bg-muted text-muted-foreground",
  outline: "border border-brand/30 text-brand",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
