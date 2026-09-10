import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductThumb } from "@/components/ProductThumb";
import { productHref, type Product } from "@/lib/products";

/**
 * Kartica jedne mašine — fotografija, naziv, kratak opis, cela je jedan link.
 *
 * Isti komad stoji na stranici tipa (`/masine/[kategorija]`) i na stranici
 * grane koja odmah nabraja mašine (`/masine/grana/sumske`), pa živi ovde: dve
 * mreže mašina koje se razlikuju u senci ili u kadru izgledale bi kao dva
 * različita sajta.
 *
 * `nivo` je nivo naslova, ne izgled: u mreži pod `h1` naziv mašine je `h2`, a
 * kad je mreža podeljena po tipovima (i tip nosi `h2`) naziv je `h3`. Vizuelno
 * su isti — čita se samo struktura strane.
 */
export function MasinaKartica({
  masina,
  nivo = 2,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: {
  masina: Product;
  nivo?: 2 | 3;
  sizes?: string;
}) {
  const Naslov = nivo === 3 ? "h3" : "h2";

  return (
    <Link
      href={productHref(masina)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bone shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
    >
      <ProductThumb
        src={masina.image}
        name={masina.name}
        kind="masina"
        typeKey={masina.typeKey}
        groupKey={masina.groupKey}
        code={masina.id}
        metaLabel={masina.brandLabel}
        podloga="bg-bone"
        sizes={sizes}
        className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-105"
      />
      <div className="flex flex-1 flex-col p-4">
        <Naslov className="font-display text-[0.95rem] font-bold leading-tight text-charcoal group-hover:text-brand">
          {masina.name}
        </Naslov>
        {masina.tagline ? (
          <p className="mt-1.5 text-[0.85rem] leading-snug text-muted-foreground">
            {masina.tagline}
          </p>
        ) : null}
        <div className="flex-1" />
        <span className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-medium text-brand">
          Detaljnije
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
