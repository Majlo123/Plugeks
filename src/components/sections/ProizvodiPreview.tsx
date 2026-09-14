import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { machines, facetLabel } from "@/lib/catalog";
import { SectionHeading } from "@/components/ui/section-heading";
import { MachineCard } from "@/components/CatalogCard";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";

/**
 * Izdvojeni modeli — kompaktna mreža (do 4 u redu) u stilu modernog web-shopa.
 *
 * Bira se RUČNO, po kataloškom broju, a ne „prvih osam iz fajla": redosled u
 * `machines.json` ide po grani i tipu, pa bi prvih osam bile dve baštenske
 * kosilice i šest mašina za košenje. Ovde je po jedan predstavnik posla za koji
 * nas kupci najčešće zovu; mašina koje više nema u katalogu jednostavno ispada.
 */
const IZDVOJENE = [
  "5034", // Plug NERO
  "5015", // Malčer G LINE
  "5014", // Freza VIVA
  "5033", // Tanjirača BRONCA
  "5006", // Kosačica JASA
  "5031", // Gruber HERO
  "5054", // Cepač drva REX (kardanski pogon)
  "5004", // Rolo balirka ARGA
];
const featured = IZDVOJENE.map((id) => machines.find((m) => m.id === id)).filter(
  (m): m is (typeof machines)[number] => Boolean(m),
);

export function ProizvodiPreview() {
  return (
    <section className="section bg-white">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Izdvajamo"
            title="Najtraženije mašine"
            description="Modeli koje naši kupci najčešće biraju. Za svaki zatražite ponudu u par klikova."
          />
          <Button asChild variant="outline" size="md" className="hidden shrink-0 sm:inline-flex">
            <Link href="/proizvodi?vrsta=masine">
              Ceo katalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((m, i) => (
            <Reveal key={m.id} delay={(i % 4) * 0.06}>
              <MachineCard
                item={m}
                typeLabel={facetLabel("masine", "tip", m.facets.tip)}
              />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" size="md" className="w-full">
            <Link href="/proizvodi?vrsta=masine">
              Pogledaj ceo katalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
