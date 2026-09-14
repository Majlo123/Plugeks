import {
  getProductsWithPhotos,
  productHref,
  natpisSlike,
  slikeMasine,
  machineCategories,
  machineBranches,
  getMachinesByCategory,
  getMachinesByBranch,
  trailerCategories,
  trailerAccessoryGroups,
  getTrailersByType,
  partTypes,
  partBrands,
  partTypeBrandPairs,
  getPartsByType,
  getPartsByBrand,
  getPartsByTypeAndBrand,
  type Product,
} from "@/lib/products";
import { categories } from "@/lib/data";
import { granaHref, type GranaKljuc } from "@/lib/masine";

/**
 * Image sitemap — poseban XML sa `image:` namespace-om, jer ugrađeni Next 14
 * sitemap ne ume da upiše `<image:image>` unose. Ovo je mehanizam kojim se
 * fotografije sajta prijavljuju za Google Images.
 *
 * Obuhvata SVE slike koje sajt prikazuje:
 *
 *  1. svaki proizvod sa pravom fotografijom — crteže delova (`/images/plugovi/`,
 *     `/images/rotodrljace/`), Rolland fotografije (`/images/rolland/`), Hofman
 *     mašine (`/images/masine/hofman/`) sa fotografijama izvedbi
 *     (`…/hofman/izvedbe/`) i studijske snimke prikolica (`/images/prikolice/`),
 *     svaka uz stranicu SVOG proizvoda;
 *  2. slike samog sajta (`SLIKE_SAJTA`) — hero, ulazi u katalog, kartice
 *     kategorija, OG slika i logo — uz stranicu na kojoj stoje.
 *
 * Ranije su Rolland i Vesta slike bile izostavljene i blokirane
 * `X-Robots-Tag: noindex` headerom; ta zabrana je uklonjena svesnom odlukom
 * vlasnika sajta, a od sad se prijavljuje apsolutno sve (isto tako odluka
 * vlasnika). Kad se neka slika proizvoda zameni sopstvenom fotografijom, ovde
 * ne treba menjati ništa — čita se `images.json`.
 *
 * `image:title` i `image:caption` se i dalje upisuju, ali bez iluzija: Google od
 * avgusta 2022. iz ovog fajla čita SAMO `<image:loc>`; ostala polja su ostala
 * zbog Bing-a i ostalih. Opis koji Google stvarno veže za sliku dolazi sa same
 * strane — `alt` na slici i `<figcaption>` ispod nje — pa je isti tekst
 * namerno na sva tri mesta (vidi `natpisSlike`).
 */

const BASE = "https://plugeks.com";

/** Google prihvata najviše 1000 slika po jednom `<url>` unosu. */
const MAX_PO_STRANI = 1000;

/** Koliko slika po KATEGORIJSKOJ strani delova ide u spisak — vidi `slikeKategorija`. */
const MAX_PO_KATEGORIJI = 24;

type Unos = { loc: string; slika: string; naslov: string; natpis: string };

/**
 * Slike sajta koje nisu proizvodi — svaka uz stranicu na kojoj se stvarno
 * prikazuje (Google traži da slika bude na toj strani). Kategorijske kartice
 * stoje i na početnoj i na `/masine`, pa idu uz obe.
 */
function slikeSajta(): Unos[] {
  const pocetna: Unos[] = [
    {
      loc: "/",
      slika: "/images/hero.jpg",
      naslov: "PlugekS — uvoz i prodaja poljoprivrednih delova i mašina",
      natpis: "Traktor u radu na njivi — PlugekS, Žabalj, uvoz i prodaja poljoprivrednih delova i mašina",
    },
    {
      loc: "/",
      slika: "/images/ulaz/masine.jpg",
      naslov: "Poljoprivredne mašine — PlugekS",
      natpis: "Malčer, plug i tanjirača Hofman — poljoprivredne mašine iz ponude PlugekS",
    },
    {
      loc: "/",
      slika: "/images/ulaz/delovi.jpg",
      naslov: "Rezervni delovi za plugove — PlugekS",
      natpis: "Plužna daska, grudi daske i raonik — rezervni delovi za plugove iz ponude PlugekS",
    },
    {
      loc: "/",
      slika: "/images/ulaz/prikolice.jpg",
      naslov: "Auto-prikolice Vesta — PlugekS",
      natpis: "Auto-prikolice Vesta sa stranicama, poklopcem i kočnicom — iz ponude PlugekS",
    },
    {
      loc: "/",
      slika: "/images/malceri.jpg",
      naslov: "Sezonska akcija — PlugekS",
      natpis: "Poljoprivredna mehanizacija u radu — akcijska ponuda PlugekS",
    },
    {
      loc: "/",
      slika: "/images/cta.jpg",
      naslov: "Zatražite ponudu — PlugekS",
      natpis: "Njiva u sezoni — PlugekS šalje ponudu isti dan",
    },
    // IZUZETAK od pravila „prijavljuje se sve" iz zaglavlja: `/og.jpg` i
    // `/images/logo-full.png` NAMERNO nisu ovde.
    //
    // `/og.jpg` nije <img> ni na jednoj strani — to je isključivo kartica za
    // deljenje. Logo jeste, ali u headeru i futeru SVAKE strane, pa ga je
    // Google uzimao za sliku celog sajta: u pretrazi po nazivu dela je uz
    // rezultat izlazio logo umesto crteža. Za knowledge panel je dovoljno polje
    // `logo` u structured data (vidi `components/FirmaJsonLd.tsx`) — to je
    // kanal predviđen za logo; image sitemap nije.
  ];

  // Kartice kategorija: na početnoj sve, na `/masine` samo grane mašina.
  const kartice = categories.map((c) => ({
    slika: c.image,
    naslov: `${c.label} — PlugekS`,
    natpis: `${c.label}: ${c.description}`,
    grana: (["poljoprivredne", "sumske", "gradjevinske"] as string[]).includes(c.key),
    key: c.key,
  }));

  const naPocetnoj = kartice.map((k) => ({ loc: "/", slika: k.slika, naslov: k.naslov, natpis: k.natpis }));
  // Samo `/masine` — TU se kartica grane zaista prikazuje. Na samoj strani
  // grane (`/masine/grana/...`) je nema, a slika prijavljena uz stranu na kojoj
  // se ne vidi je za Google neispravan par i baca sumnju na ostale unose.
  // Strane grana svoje slike dobijaju niže, iz stvarnih fotografija mašina.
  const naMasinama = kartice
    .filter((k) => k.grana)
    .map((k) => ({ loc: "/masine", slika: k.slika, naslov: k.naslov, natpis: k.natpis }));

  const oNama: Unos[] = [
    {
      loc: "/o-nama",
      slika: "/images/galerija-3.jpg",
      naslov: "O nama — PlugekS",
      natpis: "Mašina PlugekS u radu na njivi — porodična firma iz Žablja",
    },
  ];

  return [...pocetna, ...naPocetnoj, ...naMasinama, ...oNama];
}

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );

/** Jedan `<url>` sa svim slikama te strane — Google traži grupisanje po strani. */
function unos(loc: string, slike: Unos[]): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(`${BASE}${loc}`)}</loc>`,
    ...slike.flatMap((u) => [
      "    <image:image>",
      `      <image:loc>${escapeXml(`${BASE}${u.slika}`)}</image:loc>`,
      `      <image:title>${escapeXml(u.naslov)}</image:title>`,
      `      <image:caption>${escapeXml(u.natpis)}</image:caption>`,
      "    </image:image>",
    ]),
    "  </url>",
  ].join("\n");
}

/**
 * Slike KATEGORIJSKIH strana.
 *
 * Do sada je image sitemap prijavljivao samo strane pojedinačnih proizvoda, pa
 * je ~470 kategorijskih adresa iz `sitemap.xml` Google-u stajalo bez ijedne
 * prijavljene slike — a baš one izlaze na upite tipa „delovi za plugove
 * Lemken". Kad strana nema nijednu svoju sliku, ostaje joj `og:image`, a to je
 * do sada bio logo.
 *
 * Prijavljuju se SAMO strane koje fotografije i stvarno prikazuju: mreže mašina
 * i prikolica. `/delovi/…` i `/katalog/…` ispisuju go spisak linkova (vidi
 * `ListaProizvoda`), pa bi im unos ovde bio neispravan par strana↔slika.
 *
 * `MAX_PO_STRANI` iz GET-a i dalje seče na 1000 po strani, što nijedna
 * kategorija ne dostiže.
 */
function slikeKategorija(): Unos[] {
  const odProizvoda = (loc: string, stavke: Product[]): Unos[] =>
    stavke
      .filter((p): p is Product & { image: string } => Boolean(p.image))
      .map((p) => ({ loc, slika: p.image, naslov: p.name, natpis: natpisSlike(p) }));

  return [
    ...machineCategories().flatMap((c) =>
      odProizvoda(`/masine/${c.key}`, getMachinesByCategory(c.key)),
    ),
    ...machineBranches().flatMap((g) =>
      odProizvoda(granaHref(g.key as GranaKljuc), getMachinesByBranch(g.key)),
    ),
    ...[...trailerCategories(), ...trailerAccessoryGroups()].flatMap((c) =>
      odProizvoda(`/prikolice/${c.key}`, getTrailersByType(c.key)),
    ),
    // Strane delova otkad `ListaProizvoda` na njima ima sličice (`saSlikama`).
    // Seku se na `MAX_PO_KATEGORIJI` — ne zato što strana prikazuje manje, nego
    // da spisak od 600 kategorija puta do 300 delova ne naraste u fajl od
    // desetak megabajta. Prvih 24 je tačno ono što se vidi bez skrolovanja i
    // sasvim dovoljno da Google sliku veže za stranu.
    ...partTypes().flatMap((t) =>
      odProizvoda(`/delovi/${t.key}`, getPartsByType(t.key).slice(0, MAX_PO_KATEGORIJI)),
    ),
    ...partBrands().flatMap((b) =>
      odProizvoda(
        `/delovi/brend/${b.key}`,
        getPartsByBrand(b.key).slice(0, MAX_PO_KATEGORIJI),
      ),
    ),
    ...partTypeBrandPairs().flatMap((u) =>
      odProizvoda(
        `/delovi/${u.tipKey}/${u.brendKey}`,
        getPartsByTypeAndBrand(u.tipKey, u.brendKey).slice(0, MAX_PO_KATEGORIJI),
      ),
    ),
  ];
}

export function GET() {
  const proizvodi: Unos[] = getProductsWithPhotos()
    .filter((p): p is Product & { image: string } => Boolean(p.image))
    .flatMap((p) => [
      {
        loc: productHref(p),
        slika: p.image,
        naslov: p.name,
        natpis: natpisSlike(p),
      },
      // Fotografije izvedbi mašine, sa izvedbom u naslovu i natpisu.
      ...slikeMasine(p).map(({ slika, izvedba }) => ({
        loc: productHref(p),
        slika,
        naslov: izvedba ? `${p.name} — ${izvedba}` : p.name,
        natpis: natpisSlike(p, izvedba),
      })),
    ]);

  // Grupisanje po strani: ista slika na više strana = unos pod svakom od njih,
  // ista slika dvaput na istoj strani = jednom.
  const poStrani = new Map<string, Unos[]>();
  for (const u of [...slikeSajta(), ...slikeKategorija(), ...proizvodi]) {
    const lista = poStrani.get(u.loc) ?? [];
    if (!lista.some((x) => x.slika === u.slika)) lista.push(u);
    poStrani.set(u.loc, lista);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...[...poStrani].map(([loc, slike]) => unos(loc, slike.slice(0, MAX_PO_STRANI))),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
