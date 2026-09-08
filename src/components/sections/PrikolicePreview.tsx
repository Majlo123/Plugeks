import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trailers, trailerBadge } from "@/lib/catalog";
import { SectionHeading } from "@/components/ui/section-heading";
import { TrailerCard } from "@/components/CatalogCard";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";

/**
 * Vitrina auto-prikolica — po jedan model iz svakog programa (UNO, LIGHT, PLATO,
 * CARGO, TRANSPORTER, CRAFT, MARINE, MOTO). Kupac prvo bira namenu („treba mi za
 * čamac”), pa tek onda veličinu, a pun spisak izvedbi je u katalogu.
 */
const poProgramu = new Map<string, (typeof trailers)[number]>();
for (const t of trailers) {
  if (t.facets.tip !== "prikolica") continue;
  if (!poProgramu.has(t.facets.program)) poProgramu.set(t.facets.program, t);
}
const featured = [...poProgramu.values()].slice(0, 8);

export function PrikolicePreview() {
  if (featured.length === 0) return null;

  return (
    // Sekcija ispod (Kategorije) je takođe krem — tanka linija ih razdvaja.
    <section className="section border-b border-border bg-cream">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Novo u ponudi"
            title="Auto-prikolice od 500 do 3500 kg"
            description="Osam programa — otvorene prikolice i platforme, za prevoz vozila, građevinskih mašina, plovila i motocikala. Uz njih i dodatna oprema: cerade, stranice, čekrci i točkovi."
          />
          <Button asChild variant="outline" size="md" className="hidden shrink-0 sm:inline-flex">
            <Link href="/proizvodi?vrsta=prikolice">
              Sve prikolice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((t, i) => (
            <Reveal key={t.id} delay={(i % 4) * 0.06}>
              <TrailerCard item={t} typeLabel={trailerBadge(t)} />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" size="md" className="w-full">
            <Link href="/proizvodi?vrsta=prikolice">
              Pogledaj sve prikolice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
