import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { products } from "@/lib/data";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";

// Izdvojeni modeli — kompaktna mreža (do 4 u redu) u stilu modernog web-shopa.
const featured = products.slice(0, 8);

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
            <Link href="/proizvodi">
              Ceo katalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" size="md" className="w-full">
            <Link href="/proizvodi">
              Pogledaj ceo katalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
