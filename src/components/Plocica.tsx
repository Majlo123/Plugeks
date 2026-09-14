import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductThumb } from "@/components/ProductThumb";

/**
 * Pločica kategorije — fotografija, naziv i (van početne) broj stavki, cela je
 * jedan link.
 *
 * Koristi se svuda gde se bira VRSTA, a ne pojedinačan proizvod: pločice
 * prikolica na početnoj i na `/prikolice`. Kupac ne zna šta je „jednoosovinska
 * 1300 kg”, ali odmah prepozna prikolicu za čamac — zato slika nosi izbor, a
 * filteri (osovine, nosivost) dolaze tek u sledećem koraku.
 *
 * Kadar je 16:10, isti kao na karticama proizvoda, da pločica i kartice ispod
 * nje deluju kao ista polica.
 */
export function Plocica({
  href,
  naslov,
  podnaslov,
  broj,
  slika,
  alt,
  sitno = false,
}: {
  href: string;
  naslov: string;
  podnaslov?: string;
  broj?: string;
  slika?: string;
  alt: string;
  /** Sporedne pločice (dodatna oprema) — manji naslov, isti kadar. */
  sitno?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bone shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <ProductThumb
          src={slika}
          name={alt}
          kind="prikolica"
          podloga="bg-bone"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* `TRANSPORTER` je jedna reč od 11 slova: u koloni na uskom telefonu
            izlazila je van kartice, pa naslov tamo ide za stepenicu manji, a
            `break-words` čuva i od dužih naziva opreme. */}
        <h3
          className={
            sitno
              ? "text-sm font-semibold leading-snug text-charcoal break-words"
              : "font-display text-[0.95rem] font-bold leading-tight text-charcoal break-words min-[400px]:text-lg"
          }
        >
          {naslov}
        </h3>
        {podnaslov ? (
          <p className="mt-1 text-[0.85rem] leading-snug text-muted-foreground">
            {podnaslov}
          </p>
        ) : null}

        <div className="flex-1" />
        {/* Bez `broj` (početna strana) pločica i dalje ima poziv na klik —
            samo bez brojke koliko čega ima. */}
        <span className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-medium text-brand">
          {broj ?? "Pogledaj"}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
