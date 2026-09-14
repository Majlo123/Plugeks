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
  kind?: "masina" | "deo" | "prikolica" | "oprema";
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
  /**
   * Boja podloge kartice (npr. `bg-bone`). Kad se prosledi, fotografija se
   * stapa sa njom preko `mix-blend-multiply`.
   *
   * ZAŠTO: bela pozadina je kod studijskih snimaka ubačena u sam JPEG, pa se na
   * obojenoj kartici videla kao beo pravougaonik zalepljen na vrh. `multiply`
   * belu (255) pomnoži podlogom i dobije tačno podlogu, dok sama prikolica —
   * siva, plava, crna — ostaje nepromenjena.
   */
  podloga?: string;
};

export function ProductThumb({
  src,
  name,
  code,
  metaLabel,
  sizes = "(max-width: 640px) 50vw, 25vw",
  priority = false,
  className,
  podloga,
}: ThumbProps) {
  /**
   * Opis slike. Ime fajla je kataloski broj (`3374.jpg`), pa je `alt` jedini
   * tekst iz kog Google Images sazna šta je na slici — zato nosi i marku i broj,
   * a ne samo naziv. Marka se ne ponavlja ako je već u nazivu.
   */
  const opisSlike = [
    name,
    metaLabel && !name.toLowerCase().includes(metaLabel.toLowerCase()) ? metaLabel : null,
    code ? `kat. br. ${code}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  /* --- Prava fotografija --- */
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", podloga ?? "bg-muted", className)}>
        <Image
          src={src}
          alt={`${opisSlike} — PlugekS`}
          fill
          sizes={sizes}
          priority={priority}
          // Fotografije proizvoda su već male (prosek ~28KB), pa im optimizer
          // ne donosi ništa — a 3824 slike bi progutale mesečnu kvotu hostinga
          // za transformacije. Hero/kategorijske slike (0.6–1.8MB) je zadržavaju.
          unoptimized
          className={cn("object-cover", podloga && "mix-blend-multiply")}
        />
        {/* Bez zatamnjenja preko dna: fotografije proizvoda su na beloj podlozi,
            pa se gradijent video kao siva mrlja. Značka ima svoju podlogu i
            čita se i bez njega — na obojenoj kartici to je ista ta boja, pa
            značka nestane u pozadini, a i dalje zaklanja sliku ako se preklope. */}
        <span
          className={cn(
            "pointer-events-none absolute bottom-2 left-2 inline-flex items-center rounded-md px-1.5 py-1",
            podloga ?? "bg-cream/90 shadow-sm ring-1 ring-black/5 backdrop-blur-sm",
          )}
        >
          {/* Žig ide kao CSS POZADINA, a ne kao slikovni element. Kao element
              je logo bio zaseban, indeksabilan, u istom okviru kao i
              fotografija proizvoda — na kategorijskoj strani sa 24 kartice to
              je 24 puta logo naspram 24 puta proizvod, pa je logo bio
              najponovljenija slika strane. Kao pozadina izgleda isto, a Google
              ga uopšte ne broji kao sliku. */}
          <span
            aria-hidden
            // Širina prati odnos stranica samog logotipa (960x203 ≈ 4.73), da
            // pozadina izgleda identično slici koju je zamenila.
            className="block h-3 w-[57px] bg-contain bg-center bg-no-repeat sm:h-3.5 sm:w-[66px]"
            style={{ backgroundImage: "url('/images/logo-mark.png')" }}
          />
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
        {/* Isto kao značka iznad, ali ovde je važnije: na 1.202 strane
            proizvoda BEZ fotografije ovo je bila najveća slika na strani — i
            bio je logo. Kao pozadina, takva strana Google-u više ne nudi
            nijednu sliku, umesto da mu je nudila pogrešnu. */}
        <div
          aria-hidden
          className="w-[52%] max-w-[160px] bg-contain bg-center bg-no-repeat opacity-95"
          style={{ backgroundImage: "url('/images/logo-mark.png')", aspectRatio: "960 / 203" }}
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
