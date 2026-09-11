import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductThumb } from "@/components/ProductThumb";
import { Button } from "@/components/ui/button";
import { productPath, TRAILER_BRAND, type CatalogItem } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const THUMB_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

/**
 * Mašina — kartica. Cela vodi na detaljnu stranicu proizvoda (interni link sa
 * opisnim tekstom = dobro i za SEO); upit se šalje odatle. Bez prave fotografije
 * prikazuje se čist brendiran vizual (vidi ProductThumb).
 */
export function MachineCard({
  item,
  typeLabel,
  kind = "masina",
  brandLabel = "Rolland",
  podloga = "bg-bone",
}: {
  item: CatalogItem;
  typeLabel: string;
  /** Prikolice koriste isti kadar 16:10 i isti raspored — vidi `TrailerCard`. */
  kind?: "masina" | "prikolica" | "oprema";
  brandLabel?: string;
  /** Boja podloge kartice — prljavo bela na svim karticama proizvoda. */
  podloga?: string;
}) {
  const href = productPath(item);
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        podloga,
      )}
    >
      {/* 16:10 — isti kadar kao slike mašina, pa se cela mašina vidi bez opsecanja. */}
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden" aria-label={item.name}>
        <ProductThumb
          src={item.image}
          name={item.name}
          kind={kind}
          typeKey={item.facets.tip}
          code={item.id}
          metaLabel={brandLabel}
          sizes={THUMB_SIZES}
          podloga={podloga}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[0.72rem] font-medium text-cream backdrop-blur-sm">
          {typeLabel}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[1.05rem] font-bold leading-tight text-charcoal">
          <Link href={href} className="transition-colors hover:text-brand">
            {item.name}
          </Link>
        </h3>
        {/* Bez `line-clamp`: na uskom telefonu se opis prikolice („Jednoosovinska,
            750 kg, tovarni prostor 2,5 × 1,3 m") prelama u četiri reda, pa je
            skraćivanje na dva sakrivalo tačno onaj podatak zbog kog kupac i
            gleda karticu. Dugme ostaje poravnato jer ga `flex-1` gura na dno. */}
        {item.tagline ? (
          <p className="mt-1 text-[0.85rem] leading-snug text-muted-foreground">
            {item.tagline}
          </p>
        ) : null}

        <div className="flex-1" />
        <Button asChild variant="primary" size="sm" className="mt-4 w-full">
          <Link href={href}>
            Detaljnije
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

/** Auto-prikolica — ista kartica kao mašina, samo drugi brend i vrsta vizuala. */
export function TrailerCard({ item, typeLabel }: { item: CatalogItem; typeLabel: string }) {
  return (
    <MachineCard
      item={item}
      typeLabel={typeLabel}
      kind="prikolica"
      brandLabel={TRAILER_BRAND.label}
    />
  );
}

/**
 * Rezervni deo — kartica u istom stilu kao mašina (na zahtev: „da se lepo sve
 * vidi"). Nosi oznake (brend / tip / strana); vizual je brendiran tile sa
 * ikonicom tipa i kataloškim brojem dok ne stigne prava fotografija.
 */
export function PartCard({ item, tags }: { item: CatalogItem; tags: string[] }) {
  const href = productPath(item);
  const badge = tags[0];
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bone shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      {/* Kvadrat, a ne 4:3 — Rolland fotografije delova su uspravne (472x630),
          pa im je posle opsecanja bele sadržaj u proseku kvadratan. U položenom
          kadru je `object-cover` sekao pola dela. */}
      <Link href={href} className="relative block aspect-square overflow-hidden" aria-label={item.name}>
        <ProductThumb
          src={item.image}
          name={item.name}
          kind="deo"
          typeKey={item.facets.tip}
          groupKey={item.facets.grupa}
          code={item.id}
          metaLabel={badge}
          sizes={THUMB_SIZES}
          podloga="bg-bone"
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {/* Bez `line-clamp`: broj sa dela („Daska Kverneland 063 261") stoji u
            nazivu, a u dve kolone na telefonu se naziv prelama u tri-četiri
            reda — skraćivanje na dva je odsecalo baš taj broj, po kom kupac i
            proverava da li je to njegov komad. Isto važi i za karticu mašine. */}
        <h3 className="text-sm font-semibold leading-snug text-charcoal">
          <Link href={href} className="transition-colors hover:text-brand">
            {item.name}
          </Link>
        </h3>

        {/* Naš kataloški broj — isti onaj koji stoji u tabeli na stranici dela i
            koji kupac diktira telefonom. */}
        <p className="mt-1 text-[0.72rem] font-medium tabular-nums text-muted-foreground">
          Kat. br. {item.id}
        </p>

        {tags.length > 1 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(1).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-0.5 text-[0.7rem] text-foreground/85"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex-1" />
        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link href={href}>
            Detaljnije
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
