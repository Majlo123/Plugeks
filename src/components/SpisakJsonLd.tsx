import { productHref, type Product } from "@/lib/products";

const SITE_URL = "https://plugeks.com";

/**
 * ItemList strukturirani podaci za kategorijske stranice.
 *
 * ZAŠTO: `BreadcrumbList` (vidi `PutanjaJsonLd`) govori Google-u GDE je stranica
 * u sajtu, ali ne i ŠTA je na njoj. Bez ItemList-a stranica „Delovi za plugove
 * Lemken" je za pretraživač obična strana sa gomilom linkova; sa njim je spisak
 * proizvoda sa poznatim brojem stavki, što je tačno ono što se traži upitom
 * „deo za Lemken".
 *
 * Navodi se samo redosled i adresa svake stavke (`url`), bez cene — cena se kod
 * nas dogovara upitom, pa bi `offers` ovde bio izmišljen podatak.
 */
export function SpisakJsonLd({
  naziv,
  opis,
  stavke,
  ukupno,
}: {
  naziv: string;
  opis?: string;
  stavke: Product[];
  /** Ukupan broj u kategoriji kad je na stranici prikazan samo deo. */
  ukupno?: number;
}) {
  if (stavke.length === 0) return null;

  const json = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: naziv,
    ...(opis ? { description: opis } : {}),
    numberOfItems: ukupno ?? stavke.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: stavke.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${SITE_URL}${productHref(p)}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/**
 * FAQPage strukturirani podaci. Google ume da ih prikaže kao proširen rezultat
 * (pitanja ispod naslova), čime unos zauzme više prostora u listi rezultata.
 * Pitanja moraju biti vidljiva i na samoj stranici — vidi `Pitanja`.
 */
export function PitanjaJsonLd({ pitanja }: { pitanja: { q: string; a: string }[] }) {
  if (pitanja.length === 0) return null;

  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pitanja.map((p) => ({
      "@type": "Question",
      name: p.q,
      acceptedAnswer: { "@type": "Answer", text: p.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/** Vidljiva pitanja i odgovori — par uz `PitanjaJsonLd`. */
export function Pitanja({ pitanja }: { pitanja: { q: string; a: string }[] }) {
  if (pitanja.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-6">
      <h2 className="font-display text-xl font-bold text-charcoal">Česta pitanja</h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        {pitanja.map((p) => (
          <div key={p.q}>
            <dt className="text-sm font-semibold text-charcoal">{p.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
