import * as React from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ImageIcon } from "lucide-react";
import type { ImageTone } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Vizual sa premium fallback-om.
 *  - Ako je prosleđen `src` → prikazuje pravu sliku (next/image) preko gradijenta.
 *  - Ako nema `src` → prikazuje brendirani gradijent + ikonicu (uvek izgleda uredno).
 *
 * ZAMENA SLIKE: slike su u /public/images. Promeni `src` ili zameni fajl
 * istog imena. Vidi README → "Zamena placeholder slika".
 */

const tones: Record<ImageTone, string> = {
  field: "from-brand-600 via-brand to-charcoal",
  forest: "from-[#14532d] via-brand to-charcoal",
  soil: "from-[#5b3a1e] via-[#3f2a16] to-charcoal",
  steel: "from-[#374151] via-[#1f2937] to-charcoal",
  harvest: "from-accent-600 via-[#8a6a16] to-charcoal",
};

type Props = {
  tone?: ImageTone;
  icon?: LucideIcon;
  label?: string;
  className?: string;
  src?: string;
  alt?: string;
  priority?: boolean;
  sizes?: string;
  showHint?: boolean; // diskretna "ZAMENI fotografiju" oznaka (samo bez src)
  children?: React.ReactNode;
};

export function MediaPlaceholder({
  tone = "field",
  icon: Icon = ImageIcon,
  label,
  className,
  src,
  alt,
  priority = false,
  sizes = "100vw",
  showHint = false,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "relative isolate flex items-center justify-center overflow-hidden bg-gradient-to-br",
        tones[tone],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? label ?? ""}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <>
          {/* suptilni pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
          {/* svetlosni odsjaj */}
          <div className="pointer-events-none absolute -left-1/4 -top-1/3 h-2/3 w-2/3 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center text-cream/90">
            <Icon className="h-12 w-12 opacity-80" strokeWidth={1.4} aria-hidden />
            {label ? (
              <span className="max-w-[14rem] text-sm font-medium text-cream/80">
                {label}
              </span>
            ) : null}
          </div>
          {showHint ? (
            <span className="absolute bottom-3 right-3 z-20 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cream/70 backdrop-blur-sm">
              ZAMENI fotografiju
            </span>
          ) : null}
        </>
      )}

      {children}
    </div>
  );
}
