import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Vizual proizvoda.
 *  - Ako postoji PRAVA fotografija → prikazuje je (next/image) + PlugekS logo u uglu.
 *  - Ako ne (Rolland ima „photo coming soon" za taj deo) → čist, brendiran
 *    PlugekS placeholder sa logom i oznakom „Fotografija uskoro" + kataloškim
 *    brojem, da nijedan proizvod ne izgleda prazno.
 *
 * Čim se ubaci prava fotografija u `public/images/rolland/{id}.jpg` (+ upis u
 * images.json), vizual se sam zameni. Sve je originalno / klijent-safe.
 */

type ThumbProps = {
  src?: string;
  name: string;
  kind?: "masina" | "deo";
  /** Zadržani zbog poziva iz kartica — trenutno se ne koriste za izbor slike. */
  typeKey?: string;
  groupKey?: string;
  /** Kataloški broj / ID — prikazuje se na placeholder-u. */
  code?: string;
  /** Kratka oznaka (npr. brend) — prikazuje se na placeholder-u. */
  metaLabel?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function ProductThumb({
  src,
  name,
  code,
  metaLabel,
  sizes = "(max-width: 640px) 50vw, 25vw",
  priority = false,
  className,
}: ThumbProps) {
  /* --- Prava fotografija --- */
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={src}
          alt={`${name} | PlugekS`}
          fill
          sizes={sizes}
          priority={priority}
          // Fotografije proizvoda su već male (prosek ~28KB), pa im optimizer
          // ne donosi ništa — a 3824 slike bi progutale mesečnu kvotu hostinga
          // za transformacije. Hero/kategorijske slike (0.6–1.8MB) je zadržavaju.
          unoptimized
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center rounded-md bg-cream/90 px-1.5 py-1 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-mark.png" alt="" aria-hidden className="h-3 w-auto sm:h-3.5" />
        </span>
      </div>
    );
  }

  /* --- Nema fotografije → brendiran placeholder --- */
  return (
    <div
      className={cn(
        "relative isolate flex flex-col overflow-hidden bg-gradient-to-br from-muted/50 via-white to-cream",
        className,
      )}
      role="img"
      aria-label={`${name} — PlugekS (fotografija uskoro)`}
    >
      {/* diskretan pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(27,94,32,0.06)_1px,transparent_0)] [background-size:18px_18px]" />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-2 px-4 py-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-mark.png"
          alt=""
          aria-hidden
          className="w-[52%] max-w-[160px] opacity-95"
        />
        <span className="text-[0.64rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Fotografija uskoro
        </span>
      </div>

      {metaLabel || code ? (
        <div className="relative z-10 flex items-center justify-between gap-2 border-t border-black/5 px-3 py-2">
          {metaLabel ? (
            <span className="min-w-0 truncate text-[0.66rem] font-medium text-foreground/70">
              {metaLabel}
            </span>
          ) : (
            <span />
          )}
          {code ? (
            <span className="shrink-0 text-[0.66rem] font-semibold text-muted-foreground">
              Kat. {code}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
