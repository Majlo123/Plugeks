import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Caravan,
  Check,
  Cog,
  Wrench,
  Phone,
  ShieldCheck,
  Truck,
  Landmark,
} from "lucide-react";
import { ProductThumb } from "@/components/ProductThumb";
import { TabelaModela } from "@/components/TabelaModela";
import {
  IzvedbeProvider,
  BiracIzvedbe,
  OpisIzvedbe,
  GalerijaMasine,
  PonudaZaIzvedbu,
} from "@/components/IzvedbeMasine";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  getAllProducts,
  getProductBySlug,
  productHref,
  productSlug,
  relatedProducts,
  machineDescription,
  machineHighlights,
  partDescription,
  natpisSlike,
  podaciIzvedbe,
  slikeMasine,
  ukrstenaHref,
  tipZaMasinu,
  dimenzijeSlike,
  ogSlikaProizvoda,
  trailerDescription,
  trailerHighlights,
  type Product,
} from "@/lib/products";
import { TRAILER_BRAND } from "@/lib/catalog";
import { CENOVNIK, ispisCene, datumCenovnika } from "@/lib/cene";

const SITE_URL = "https://plugeks.com";

/**
 * Svi poznati proizvodi se generišu statički. `dynamicParams` je uključen samo
 * zbog STARIH adresa: kad se proizvod preimenuje (npr. „Plužna daska" →
 * „Daska"), slug se menja, a zapamćeni/indeksirani linkovi bi vraćali 404.
 * Zato slug koji nosi postojeći kataloški broj na kraju ide 308 na novu adresu
 * (vidi `getProductBySlug` → `idFromSlug`), a sve ostalo je i dalje 404.
 */
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

/* ------------------------------- Pomoćno ---------------------------------- */

const abs = (path: string) => `${SITE_URL}${path}`;

const quoteHref = (p: Product) =>
  `/zatrazi-ponudu?proizvod=${encodeURIComponent(p.name)}`;

const catalogHref = (p: Product) => {
  if (p.kind === "masina")
    return `/proizvodi?vrsta=masine${p.typeKey ? `&tip=${p.typeKey}` : ""}`;
  return `/proizvodi?vrsta=delovi${p.brandKey ? `&brend=${p.brandKey}` : ""}`;
};

/**
 * Putanja iznad proizvoda (bez „Početna" i bez samog proizvoda).
 *
 * Prikolice imaju svoju granu — `/prikolice` → program — pa ne prolaze kroz
 * opšti katalog: kupac koji se vraća korak nazad završi u spisku modela iz
 * kog je i došao, a ne u fasetama koje za prikolice više ne postoje.
 */
const putanja = (p: Product): { naziv: string; href: string }[] => {
  if (p.kind === "prikolica" || p.kind === "oprema")
    return [
      { naziv: "Auto-prikolice", href: "/prikolice" },
      ...(p.typeKey
        ? [{ naziv: p.typeLabel ?? p.groupLabel, href: `/prikolice/${p.typeKey}` }]
        : []),
    ];

  if (p.kind === "masina")
    return [
      { naziv: "Proizvodi", href: "/proizvodi" },
      p.typeKey
        ? { naziv: p.groupLabel, href: `/masine/${p.typeKey}` }
        : { naziv: p.groupLabel, href: catalogHref(p) },
    ];

  // Delovi: nagore idu u indeksirane kategorije (`/delovi/...`), a ne u
  // `/proizvodi?vrsta=delovi&brend=...`. Filter-URL je za Google ista strana kao
  // katalog, pa su sve 4.644 strane dela do sada pokazivale nagore u prazno.
  const ukrstena = ukrstenaHref(p.typeKey, p.brandKey);
  return [
    { naziv: "Proizvodi", href: "/proizvodi" },
    ...(p.typeKey && p.typeLabel
      ? [{ naziv: tipZaMasinu(p.typeLabel, p.groupKey), href: `/delovi/${p.typeKey}` }]
      : [{ naziv: p.groupLabel, href: catalogHref(p) }]),
    ...(ukrstena && p.typeLabel && p.brandLabel
      ? [{ naziv: `${p.typeLabel} ${p.brandLabel}`, href: ukrstena }]
      : []),
  ];
};

/** Jedan izvor opisnog teksta — koristi ga i metadata, i JSON-LD, i sama stranica. */
const opisProizvoda = (p: Product) =>
  p.kind === "masina"
    ? machineDescription(p)
    : p.kind === "deo"
      ? partDescription(p)
      : trailerDescription(p);

/* ------------------------------- Metadata --------------------------------- */

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const p = getProductBySlug(params.slug);
  if (!p) return {};

  const canonical = `/proizvod/${p.slug}`;
  // Kataloški broj je u naslovu zato što ga kupac često i kuca — prepiše ga sa
  // starog dela. Marka se NE dodaje: svih 4.567 naziva brendiranih delova je već
  // sadrži, pa bi je naslov ponovio i probio dužinu koju Google prikaže.
  const title =
    p.kind === "masina"
      ? `${p.name}${p.brandLabel ? ` — ${p.brandLabel}` : ""}`
      : p.kind === "deo"
        ? `${p.name} — kat. br. ${p.id}`
        : `${p.name} — ${TRAILER_BRAND.label}`;
  const description =
    p.kind === "deo"
      ? `${p.name}. ${p.brandLabel && p.brandKey !== "univerzalno" ? `Za mašine ${p.brandLabel}. ` : ""}Zatražite ponudu — cena i rok isporuke isti dan. PlugekS, isporuka širom Srbije.`
      : opisProizvoda(p).slice(0, 155);

  /**
   * Proizvod BEZ fotografije namerno ostaje bez og:image umesto da podmetne
   * logo: 1.202 adrese pod `/proizvod/…` su Google-u do sada tvrdile da im je
   * glavna slika logo firme, pa se logo vezao baš za pretrage po nazivu dela.
   * Bolje nijedna slika nego pogrešna.
   */
  const ogSlika = ogSlikaProizvoda(p);

  return {
    title,
    description,
    alternates: { canonical },
    // Izvedbe mašine ulaze u ključne reči: „TERA HP 240" je upit koji kupac
    // stvarno kuca, a nigde drugde na stranici ne stoji kao zaseban pojam.
    // `Set` je zbog mašina, kod kojih su tip i grupa isti pojam („Cepači drva").
    keywords: [
      ...new Set(
        [
          p.name,
          ...(p.tabela?.kolone ?? []),
          p.brandLabel,
          p.typeLabel,
          p.groupLabel,
          "PlugekS",
        ].filter((k): k is string => Boolean(k)),
      ),
    ],
    openGraph: {
      type: "website",
      url: abs(canonical),
      title: `${p.name} | PlugekS`,
      description,
      ...(ogSlika ? { images: [ogSlika] } : {}),
    },
    // Bez ovoga se iz layout-a nasleđuje `twitter:image = /og.jpg` (logo), pa
    // stranica istovremeno tvrdi dve različite glavne slike — Google Images je
    // uz stranicu dela prikazivao logo umesto crteža.
    twitter: {
      card: "summary_large_image",
      title: `${p.name} | PlugekS`,
      description,
      ...(ogSlika ? { images: [ogSlika] } : {}),
    },
  };
}

/* ------------------------------- JSON-LD ---------------------------------- */

function ProductJsonLd({ p }: { p: Product }) {
  const canonical = abs(`/proizvod/${p.slug}`);
  const [sirina, visina] = dimenzijeSlike(p.kind);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical}#proizvod`,
    // Vezuje proizvod za BAŠ OVU adresu; bez toga isti `Product` može da se
    // pripiše i spisku na kom se pominje.
    mainEntityOfPage: { "@id": `${canonical}#stranica` },
    name: p.name,
    description: opisProizvoda(p),
    category: p.groupLabel,
    // Slika u structured data samo kad postoji PRAVA fotografija proizvoda.
    //
    // Pun `ImageObject` umesto golog URL-a: fajl se zove po kataloškom broju
    // (`2719.jpg`), pa Google iz imena ne zaključuje ništa. Ovako uz sliku ide
    // naziv, natpis i — što je ovde i poenta — `contentUrl` vezan za baš ovu
    // stranicu preko `mainEntityOfPage`. Bez toga Google Images ume da istu
    // sliku pripiše širem spisku proizvoda umesto stranici samog dela.
    ...(p.image
      ? {
          image: [
            {
              "@type": "ImageObject",
              // `@id` postoji da bi `primaryImageOfPage` ispod pokazao baš na
              // ovu sliku, umesto da je ponovi kao zaseban, treći entitet.
              "@id": `${canonical}#slika`,
              contentUrl: abs(p.image),
              url: abs(p.image),
              name: p.name,
              caption: natpisSlike(p),
              // Dimenzije: bez njih Google mora da preuzme fajl da bi saznao
              // koliko je slika velika, a do tada je tretira kao možda sitnu.
              width: sirina,
              height: visina,
              representativeOfPage: true,
              mainEntityOfPage: canonical,
            },
            // Fotografije izvedbi (mašine) — iste koje stranica pokazuje posle
            // izbora modela, sa izvedbom u natpisu.
            ...slikeMasine(p).map(({ slika, izvedba }) => ({
              "@type": "ImageObject",
              contentUrl: abs(slika),
              url: abs(slika),
              name: izvedba ? `${p.name} — ${izvedba}` : p.name,
              caption: natpisSlike(p, izvedba),
              width: sirina,
              height: visina,
              mainEntityOfPage: canonical,
            })),
          ],
        }
      : {}),
    url: canonical,
    sku: p.id,
    ...(p.brandLabel && p.brandKey !== "univerzalno"
      ? { brand: { "@type": "Brand", name: p.brandLabel } }
      : {}),
    /**
     * `offers` ide SAMO uz proizvod koji ima cenu na cenovniku — danas su to
     * prikolice i oprema (vidi `lib/cene.ts`).
     *
     * Delovi i mašine se dogovaraju upitom, pa za njih ponude nema: `Offer`
     * bez `price` Google smatra neispravnim i ume da odbaci ceo `Product` node
     * zajedno sa njim, a time bi otišla i `image` lista iznad. `Product` bez
     * ponude je ispravan schema.org zapis — Search Console ga doduše vodi kao
     * „nije za rich results", što je za deo na upit i tačno.
     *
     * Iznos u ponudi je isti koji stranica ispisuje (Google traži da se
     * strukturirani podaci poklapaju sa vidljivim sadržajem).
     *
     * Prodavac se pominje preko `@id` reference na `Store` node sa početne
     * (vidi `components/FirmaJsonLd.tsx`) — bez ponavljanja logoa.
     */
    ...(p.cena != null
      ? {
          offers: {
            "@type": "Offer",
            url: canonical,
            price: p.cena,
            priceCurrency: CENOVNIK.valuta,
            itemCondition: "https://schema.org/NewCondition",
            // Bez `availability`: prikolice se poručuju od proizvođača, pa
            // „na stanju" ne bismo smeli da tvrdimo. Google to vodi kao
            // preporuku (upozorenje), ne kao grešku.
            seller: { "@id": `${SITE_URL}/#plugeks` },
          },
        }
      : {}),
    seller: { "@id": `${SITE_URL}/#plugeks` },
  };

  /**
   * `ItemPage` + `primaryImageOfPage` — izričita tvrdnja „glavna slika OVE
   * strane je crtež dela", uz `@id` koji pokazuje na `ImageObject` iznad.
   *
   * To je jedino mesto na kom se glavna slika strane navodi kao svojstvo same
   * STRANE, a ne proizvoda. Ostalo (og:image, ImageObject, image sitemap)
   * govori o slici; ovo govori o strani, pa Google nema šta da bira kad na
   * istoj adresi nađe i logo iz headera.
   *
   * Emituje se samo kad fotografija postoji — inače bi strana tvrdila da ima
   * glavnu sliku koje nema.
   */
  const stranica = p.image
    ? {
        "@context": "https://schema.org",
        "@type": "ItemPage",
        "@id": `${canonical}#stranica`,
        url: canonical,
        name: p.name,
        primaryImageOfPage: { "@id": `${canonical}#slika` },
        mainEntity: { "@id": `${canonical}#proizvod` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      }
    : null;

  const iznad = putanja(p);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: SITE_URL },
      ...iznad.map((s, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: s.naziv,
        item: abs(s.href),
      })),
      {
        "@type": "ListItem",
        position: iznad.length + 2,
        name: p.name,
        item: abs(`/proizvod/${p.slug}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
      {stranica ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(stranica) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}

/* -------------------------------- Stranica -------------------------------- */

export default function ProductPage({ params }: { params: { slug: string } }) {
  const p = getProductBySlug(params.slug);
  if (!p) notFound();
  // Stari slug istog proizvoda → trajno preusmerenje na aktuelnu adresu.
  if (params.slug !== p.slug) permanentRedirect(productHref(p));

  // Podaci kartice za SVAKU izvedbu (vidi `OpisIzvedbe`). Računaju se ovde, na
  // serveru, pa klijentska komponenta samo bira po indeksu. Prazno kod mašina
  // bez izvedbi i kod onih kojima tabela ima jednu kolonu za ceo program.
  const kartice = (p.izvedbe ?? []).map((i) => podaciIzvedbe(p.tabela, i.naziv));

  return (
    <>
      <ProductJsonLd p={p} />

      <article className="bg-cream pb-16 pt-28 md:pt-32">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-brand">Početna</Link>
            {putanja(p).map((s) => (
              <span key={s.href} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={s.href} className="hover:text-brand">
                  {s.naziv}
                </Link>
              </span>
            ))}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-charcoal">{p.name}</span>
          </nav>

          {/* Mašina sa izvedbama: izbor modela pokreće galeriju (levo), tabelu
              i ponudu (desno) — vidi `IzvedbeMasine`. Ostali proizvodi prolaze
              kroz isti okvir netaknuti. */}
          <IzvedbeProvider izvedbe={p.izvedbe ?? []}>
          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Vizual. `figure` + vidljiv `figcaption` nisu ukras: Google Images
                natpis uz sliku čita sa same stranice i po njemu je vezuje za
                stranicu proizvoda. Tekst je isti onaj koji ide u
                `image-sitemap.xml` i u `ImageObject` iznad. */}
            {p.kind === "masina" && p.izvedbe?.length ? (
              <GalerijaMasine
                slika={p.image}
                galerija={p.galerija ?? []}
                name={p.name}
                code={p.id}
                metaLabel={p.brandLabel}
                natpis={natpisSlike(p)}
                natpisi={p.izvedbe.map((i) => natpisSlike(p, i.naziv))}
              />
            ) : (
            <figure>
              <div className="overflow-hidden rounded-3xl border border-border bg-bone shadow-card">
                <ProductThumb
                  src={p.image}
                  name={p.name}
                  kind={p.kind}
                  typeKey={p.typeKey}
                  groupKey={p.groupKey}
                  code={p.id}
                  podloga="bg-bone"
                  metaLabel={
                    p.brandLabel && p.brandKey !== "univerzalno" ? p.brandLabel : p.typeLabel
                  }
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className={cn(
                    "w-full",
                    p.kind === "deo" ? "aspect-square" : "aspect-[16/10]",
                  )}
                />
              </div>
              <figcaption className="mt-3 text-sm text-muted-foreground">
                {p.name} — {natpisSlike(p)}
              </figcaption>
            </figure>
            )}

            {/* Podaci */}
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  {p.kind === "masina" ? (
                    <Cog className="h-3.5 w-3.5" />
                  ) : p.kind === "prikolica" ? (
                    <Caravan className="h-3.5 w-3.5" />
                  ) : (
                    <Wrench className="h-3.5 w-3.5" />
                  )}
                  {p.groupLabel}
                </span>
                {p.brandLabel && p.brandKey !== "univerzalno" ? (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80">
                    {p.brandLabel}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-charcoal md:text-4xl">
                {p.name}
              </h1>
              {p.tagline ? (
                <p className="mt-3 text-lg text-muted-foreground">{p.tagline}</p>
              ) : null}

              {/* Cena — samo prikolice i oprema sa cenovnika (vidi `lib/cene`).
                  Isti iznos ide u `offers` u JSON-LD iznad; Google traži da se
                  ono što tvrdi structured data vidi i na stranici. Datum stanja
                  stoji uz cenu da kupac zna koliko je sveža. */}
              {p.cena != null ? <Cena iznos={p.cena} /> : null}

              {/* Mašina koja ima fabričku tabelu pokazuje NJU, a ne opis.
                  Opis je kod tih mašina sastavljen automatski („…je mašina iz
                  Hofman programa za rad na gazdinstvu…") i kupcu ne kaže ništa
                  što već ne vidi iz naziva; tabela mu kaže sve. Opis i dalje
                  ide u `<meta description>` i u structured data — tamo ga
                  Google traži i tamo ne smeta.

                  Mašina bez tabele (pet Hofman modela kod kojih je izvor nema)
                  zadržava opis: kod nje je to jedini tekst na stranici. */}
              {p.kind === "masina" ? <BiracIzvedbe /> : null}

              {p.kind === "masina" && p.tabela ? (
                <div className="mt-5">
                  <p className="eyebrow">
                    <span className="h-px w-6 bg-current" />
                    Tehnički podaci
                  </p>
                  {/* Mašina čije izvedbe stoje kao kolone tabele pokazuje samo
                      KARTICU izabrane izvedbe — ne celu matricu (vidi
                      `OpisIzvedbe`). Podaci se računaju ovde, na serveru, za sve
                      izvedbe odjednom: klijentska komponenta bira po indeksu i
                      ne nosi logiku o tabeli.

                      Mašina bez izvedbi, i ona kod koje izvedbe dolaze iz
                      galerija a tabela ima jednu kolonu za ceo program, i dalje
                      dobija tabelu — tu izvedba nema svoje brojke, pa nema od
                      čega da se napravi kartica. */}
                  <div className="mt-3">
                    {kartice.some((k) => k.length > 0) ? (
                      <OpisIzvedbe podaci={kartice} />
                    ) : (
                      <TabelaModela tabela={p.tabela} />
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-4 leading-relaxed text-foreground/85">
                  {opisProizvoda(p)}
                </p>
              )}

              {p.kind === "deo" ? null : (
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {(p.kind === "masina" ? machineHighlights(p) : trailerHighlights(p)).map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-foreground/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              {/* Prikolice imaju punu fabričku specifikaciju, delovi kataloške
                  podatke. Mašine nemaju tabelu (brojke zavise od konfiguracije i
                  dogovaraju se uz ponudu), a oprema nosi svoj tehnički opis —
                  njeni fabrički atributi opisuju prikolicu, ne sam komad. */}
              {p.kind === "deo" || p.kind === "prikolica" ? <SpecTable p={p} /> : null}

              {/* CTA */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {p.kind === "masina" && p.izvedbe?.length ? (
                  <PonudaZaIzvedbu name={p.name} />
                ) : (
                  <Button asChild variant="primary" size="lg" className="sm:flex-1">
                    <Link href={quoteHref(p)}>
                      Zatraži ponudu
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="lg" className="sm:flex-1">
                  <a href={site.telHref}>
                    <Phone className="h-4 w-4" />
                    {site.phoneDisplay}
                  </a>
                </Button>
              </div>

              {/* Poverenje */}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand" /> Garancija i delovi</span>
                <span className="inline-flex items-center gap-1.5"><Landmark className="h-4 w-4 text-brand" /> Subvencije i rate</span>
                <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-brand" /> Isporuka širom Srbije</span>
              </div>
            </div>
          </div>

          </IzvedbeProvider>

          {/* Srodni proizvodi */}
          <RelatedGrid p={p} />
        </div>
      </article>
    </>
  );
}

/* ------------------------------ Podkomponente ----------------------------- */

function Cena({ iznos }: { iznos: number }) {
  const stanje = datumCenovnika();
  return (
    <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-display text-2xl font-bold tabular-nums text-charcoal md:text-3xl">
        {ispisCene(iznos)}
      </span>
      <span className="text-xs text-muted-foreground">
        cena po cenovniku{stanje ? ` (${stanje})` : ""} — potvrđujemo uz ponudu
      </span>
    </p>
  );
}

function SpecTable({ p }: { p: Product }) {
  // Prikolice nose fabričku specifikaciju (`specs`) — delovi je nemaju, pa im se
  // tabela sastavlja od kataloških podataka.
  const rows: [string, string][] = p.specs?.length
    ? [["Model", p.model ?? p.name], ...p.specs, ["Kataloški broj", p.id]]
    : [
        ["Kataloški broj", p.id],
        ["Tip dela", p.typeLabel ?? "—"],
        [
          "Brend mašine",
          p.brandKey && p.brandKey !== "univerzalno"
            ? p.brandLabel!
            : "Univerzalno / bez oznake",
        ],
        ...(p.sideLabel ? ([["Strana ugradnje", p.sideLabel]] as [string, string][]) : []),
        ["Kategorija", p.groupLabel],
      ];
  return (
    <dl className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`flex justify-between gap-4 px-4 py-3 text-sm ${i % 2 ? "bg-cream/40" : ""}`}
        >
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right font-medium text-charcoal">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function RelatedGrid({ p }: { p: Product }) {
  const related = relatedProducts(p, 4);
  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-bold text-charcoal">
        {p.kind === "masina"
          ? "Slične mašine"
          : p.kind === "prikolica"
            ? "Slične prikolice"
            : p.kind === "oprema"
              ? "Slična oprema"
              : "Slični delovi"}
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((r) => (
          <Link
            key={r.id}
            href={productHref(r)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bone shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <ProductThumb
              src={r.image}
              name={r.name}
              kind={r.kind}
              typeKey={r.typeKey}
              groupKey={r.groupKey}
              code={r.id}
              sizes="(max-width: 640px) 50vw, 25vw"
              podloga="bg-bone"
              className={cn(
                "w-full",
                r.kind === "deo" ? "aspect-square" : "aspect-[16/10]",
              )}
            />
            <div className="flex flex-1 flex-col p-3">
              <h3 className="line-clamp-2 text-sm font-semibold text-charcoal group-hover:text-brand">
                {r.name}
              </h3>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand">
                Detaljnije <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
