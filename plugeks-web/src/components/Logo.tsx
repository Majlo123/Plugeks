import { cn } from "@/lib/utils";

/**
 * Logo PlugekS — zeleno-beli kružni žig + wordmark.
 * Kanonsko pisanje: "PLUGEKS" (verzal). ZAMENI: prava SVG/PNG logotipom u /public.
 */

export function Logo({
  className,
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const textColor = variant === "light" ? "text-cream" : "text-charcoal";
  const subColor = variant === "light" ? "text-cream/78" : "text-foreground/72";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="grid h-10 w-10 place-items-center rounded-full bg-brand text-cream shadow-soft ring-1 ring-brand-600/40"
      >
        {/* Stilizovan list / brazda */}
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M12 3c4.5 1.2 7 4.6 7 9 0 4.4-2.5 7.8-7 9-4.5-1.2-7-4.6-7-9 0-4.4 2.5-7.8 7-9Z"
            fill="currentColor"
            opacity="0.18"
          />
          <path
            d="M12 20c0-5 .5-9 5-13M12 20c0-3-1-6-4-8.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-[1.38rem] font-bold tracking-[-0.02em] md:text-[1.5rem]", textColor)}>
          PLUGEKS
        </span>
        <span className={cn("mt-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.19em] md:text-xs", subColor)}>
          Napredna poljoprivreda
        </span>
      </span>
    </span>
  );
}
