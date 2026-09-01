import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { popularParts } from "@/lib/catalog";
import { SectionHeading } from "@/components/ui/section-heading";
import { PartCard } from "@/components/CatalogCard";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";

// Vitrina delova za plugove — po jedan komad od svakog brenda, sa fotografijom.
// Lista se generiše skriptom (`npm run plugovi`), ovde se samo prikazuje.
const featured = popularParts.slice(0, 8);

export function DeloviPreview() {
  if (featured.length === 0) return null;

  return (
    <section className="section bg-cream">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Delovi za plugove"
            title="Najtraženiji delovi"
            description="Daske, grudi, lemeši, plazovi i dleta za Kverneland, Lemken, Kuhn, Överum, Vogel & Noot, Regent, Rabe i Pöttinger — sa lagera ili po narudžbi."
          />
          <Button asChild variant="outline" size="md" className="hidden shrink-0 sm:inline-flex">
            <Link href="/proizvodi?vrsta=delovi&grupa=delovi-plugovi">
              Svi delovi za plugove
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((part, i) => (
            <Reveal key={part.id} delay={(i % 4) * 0.06}>
              <PartCard item={part} tags={part.tags} />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" size="md" className="w-full">
            <Link href="/proizvodi?vrsta=delovi&grupa=delovi-plugovi">
              Svi delovi za plugove
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
