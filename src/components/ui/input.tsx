import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "flex w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input ref={ref} type={type} className={cn(base, "h-12", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "min-h-28 resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(base, "h-12 appearance-none bg-white", className)} {...props} />
));
Select.displayName = "Select";
