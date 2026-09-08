import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductThumb } from "@/components/ProductThumb";
import { Button } from "@/components/ui/button";
import { productPath, TRAILER_BRAND, type CatalogItem } from "@/lib/catalog";

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
}: {
  item: CatalogItem;
  typeLabel: string;
  /** Prikolice koriste isti kadar 16:10 i isti raspored — vidi `TrailerCard`. */
  kind?: "masina" | "prikolica" | "oprema";
  brandLabel?: string;
}) {
  const href = productPath(item);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
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
        {item.tagline ? (
          <p className="mt-1 line-clamp-2 text-[0.85rem] text-muted-foreground">
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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
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
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-charcoal">
          <Link href={href} className="transition-colors hover:text-brand">
            {item.name}
          </Link>
        </h3>

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
