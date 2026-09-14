import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListaProizvoda } from "@/components/ListaProizvoda";
import {
  katalogBrojStrana,
  katalogStrana,
  KATALOG_PO_STRANI,
  getAllProducts,
  ogSlikaSpiska,
  drustveneSlike,
} from "@/lib/products";

/**
 * Kataloški indeks — sve što sajt ima, 120 po strani, kao obični linkovi.
 * Ovo je jedina ruta koja garantuje da svaki proizvod ima interni link;
 * kategorijske stranice pokrivaju ono što ljudi pretražuju, ali ne sve.
 */

const parseStrana = (raw: string) => (/^\d+$/.test(raw) ? Number(raw) : NaN);

export function generateStaticParams() {
  return Array.from({ length: katalogBrojStrana() }, (_, i) => ({ strana: String(i + 1) }));
}

export function generateMetadata({ params }: { params: { strana: string } }): Metadata {
  const strana = parseStrana(params.strana);
  const ukupno = katalogBrojStrana();
  if (!Number.isFinite(strana) || strana < 1 || strana > ukupno) return {};

  const opis = `Spisak svih ${getAllProducts().length} mašina i rezervnih delova iz PlugekS ponude, strana ${strana} od ${ukupno}.`;

  return {
    title: `Katalog — strana ${strana} od ${ukupno}`,
    description: opis,
    alternates: { canonical: `/katalog/${strana}` },
    // Svaka od ~44 strane kataloga uzima sliku prvog proizvoda sa SVOJE strane,
    // pa se ne ponavlja ista slika (ni logo) 44 puta.
    ...drustveneSlike({
      url: `/katalog/${strana}`,
      title: `Katalog — strana ${strana} | PlugekS`,
      description: opis,
      slika: ogSlikaSpiska(katalogStrana(strana)),
    }),
  };
}

export default function KatalogPage({ params }: { params: { strana: string } }) {
  const strana = parseStrana(params.strana);
  const ukupno = katalogBrojStrana();
  if (!Number.isFinite(strana) || strana < 1 || strana > ukupno) notFound();

  const items = katalogStrana(strana);
  const prvi = (strana - 1) * KATALOG_PO_STRANI + 1;

  return (
    <>
      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
            Katalog — strana {strana} od {ukupno}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Proizvodi {prvi}–{prvi + items.length - 1} od ukupno {getAllProducts().length}.
            Kliknite na naziv za detalje i zahtev za ponudu.
          </p>

          <div className="mt-8">
            <ListaProizvoda items={items} />
          </div>

          <nav className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-6 text-sm">
            {strana > 1 ? (
              <Link href={`/katalog/${strana - 1}`} className="font-medium text-brand hover:underline">
                ← Prethodna strana
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">
              {strana} / {ukupno}
            </span>
            {strana < ukupno ? (
              <Link href={`/katalog/${strana + 1}`} className="font-medium text-brand hover:underline">
                Sledeća strana →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </section>
    </>
  );
}
