import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Plocica } from "@/components/Plocica";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { TRAILER_PROGRAMS } from "@/lib/catalog";
import { trailerCategories, getTrailersByType, uzBroj } from "@/lib/products";

/**
 * Vitrina auto-prikolica — po jedna pločica za svaki program (UNO, LIGHT,
 * PLATO, CARGO, TRANSPORTER, CRAFT, MARINE, MOTO), sa fotografijom.
 *
 * Namerno vodi na program, a ne na pojedinačan model: kupac prvo prepozna po
 * slici šta mu treba („treba mi za čamac”), pa tek unutra bira broj osovina i
 * nosivost. Isti izbor stoji i na `/prikolice`, pa se koristi ista pločica.
 */
const programi = trailerCategories().map((p) => {
  // Prva prikolica programa je i njegov „portret" — sve imaju fotografiju.
  const naslovna = getTrailersByType(p.key)[0];
  return {
    ...p,
    oznaka: TRAILER_PROGRAMS[p.key]?.oznaka ?? p.label,
    kratko: TRAILER_PROGRAMS[p.key]?.kratko,
    slika: naslovna?.image,
    alt: naslovna?.name ?? p.label,
  };
});

export function PrikolicePreview() {
  if (programi.length === 0) return null;

  return (
    // Sekcija ispod (Kategorije) je takođe krem — tanka linija ih razdvaja.
    <section className="section border-b border-border bg-cream">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Novo u ponudi"
            title="Auto-prikolice"
            description="Izaberite prikolicu po slici — za svakodnevni prevoz, za automobil, građevinsku mašinu, čamac ili motocikl. Broj osovina i nosivost birate unutra."
          />
          <Button asChild variant="outline" size="md" className="hidden shrink-0 sm:inline-flex">
            <Link href="/prikolice">
              Sve prikolice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {programi.map((p, i) => (
            <Reveal key={p.key} delay={(i % 4) * 0.06}>
              <Plocica
                href={`/prikolice/${p.key}`}
                naslov={p.oznaka}
                podnaslov={p.kratko}
                broj={`${p.count} ${uzBroj(p.count, "model", "modela", "modela")}`}
                slika={p.slika}
                alt={p.alt}
              />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" size="md" className="w-full">
            <Link href="/prikolice">
              Pogledaj sve prikolice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
