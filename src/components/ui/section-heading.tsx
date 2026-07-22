import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  variant?: "dark" | "light";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  variant = "dark",
  className,
}: Props) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            "eyebrow",
            variant === "light" && "text-brand-400",
          )}
        >
          <span className="h-px w-6 bg-current" />
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          "mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-balance sm:text-4xl md:text-[2.75rem]",
          variant === "light" ? "text-cream" : "text-charcoal",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            variant === "light" ? "text-cream/85" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
