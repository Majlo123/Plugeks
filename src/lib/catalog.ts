/**
 * Katalog proizvoda — jedinstveni model za mašine i rezervne delove.
 *
 * Sve je generisano skriptama:
 *  - `src/data/machines.json` — mašine (Hofman, `npm run masine`)
 *  - `src/data/parts.json`    — rezervni delovi, ~4.960 kom: Rolland program za
 *                               plugove i ostale mašine (`npm run catalog`) +
 *                               delovi za roto drljače, drljače, freze,
 *                               setvospremače i tanjirače (`npm run ferencak`)
 *
 * Delovi se NE uvoze ovde nego kroz `loadParts()`, da ~300 KB podataka ne bi
 * ulazilo u početni bundle — učita se tek kad korisnik izabere „Rezervni delovi”.
 */

import machinesJson from "@/data/machines.json";
import trailersJson from "@/data/trailers.json";
import imagesJson from "@/data/images.json";
import machineImagesJson from "@/data/machine-images.json";
import popularJson from "@/data/popular.json";
import { categories } from "@/lib/data";
import { GRANE, granaKljucevi, tipLabel } from "@/lib/masine";
import { poredaj, type ZaRedosled } from "@/lib/redosled";
import { cenaPrikolice, poCeni } from "@/lib/cene";

/**
 * Prave fotografije proizvoda (id proizvoda → lokalna putanja): delovi sa
 * rolland.pl (`npm run slike`), crteži delova za plugove (`npm run plugovi`) i
 * crteži delova sa psc-ferencak.hr (`npm run ferencak`). Bez unosa u mapi
 * kartica pokazuje brendiran placeholder.
 *
 * `machine-images.json` ide POSLE i gazi mapu: to su ručno pripremljene slike
 * mašina (jedna mašina po kadru, 16:10, bela podloga — vidi public/images/masine),
 * pa ostaju i kad se `images.json` ponovo generiše skriptom.
 */
const productImages: Record<string, string> = {
  ...(imagesJson as Record<string, string>),
  ...(machineImagesJson as Record<string, string>),
};

/* ---------------------------------- Model ---------------------------------- */

export type CatalogType = "masine" | "delovi" | "prikolice";

/**
 * Proizvođač auto-prikolica. Ako se program ikad zameni drugim dobavljačem,
 * menja se ovde — naziv ide na kartice, u breadcrumb i u structured data.
 */
export const TRAILER_BRAND = { key: "vesta", label: "Vesta" } as const;

export type CatalogItem = {
  id: string;
  type: CatalogType;
  name: string;
  tagline?: string;
  /** Naziv marke (mašine) — za alt tekst i placeholder kartice. */
  brand?: string;
  image?: string;
  /** Vrednost po ključu fasete — vidi `FACETS`. */
  facets: Record<string, string>;
  /** Normalizovan tekst za pretragu (bez dijakritike, mala slova). */
  search: string;
  /** Cena u dinarima (samo prikolice i oprema sa cenovnika) — vidi `lib/cene`. */
  cena?: number;
};

export type FacetOption = { value: string; label: string; count: number };

export type FacetDef = {
  key: string;
  label: string;
  /** Tekst u praznom polju kad ništa nije izabrano. */
  placeholder: string;
};

/* --------------------------------- Faseta ---------------------------------- */

export const FACETS: Record<CatalogType, FacetDef[]> = {
  masine: [
    { key: "grana", label: "Vrsta posla", placeholder: "Sve grane" },
    { key: "tip", label: "Tip mašine", placeholder: "Sve vrste mašina" },
  ],
  prikolice: [
    { key: "tip", label: "Šta tražite", placeholder: "Prikolice i oprema" },
    { key: "program", label: "Program", placeholder: "Svi programi" },
    { key: "masa", label: "Najveća dozvoljena masa", placeholder: "Sve mase" },
    { key: "osovine", label: "Broj osovina", placeholder: "Jedno- i dvoosovinske" },
  ],
  delovi: [
    { key: "grupa", label: "Delovi za mašinu", placeholder: "Sve mašine" },
    { key: "brend", label: "Brend mašine", placeholder: "Svi brendovi" },
    { key: "tip", label: "Tip dela", placeholder: "Svi tipovi delova" },
    { key: "strana", label: "Strana ugradnje", placeholder: "Leva i desna" },
  ],
};

export const TYPE_META: Record<
  CatalogType,
  { label: string; description: string; image: string }
> = {
  masine: {
    label: "Mašine",
    description:
      "Poljoprivredne, šumske i građevinske mašine — od tanjirača i malčera do cepača drva i mini bagera, sve sa garancijom.",
    image: "/images/ulaz/masine.jpg",
  },
  prikolice: {
    label: "Auto-prikolice",
    description:
      "Prikolice od 500 do 3500 kg — otvorene i platforme, za vozila, mašine, plovila i motocikle. Uz njih i dodatna oprema: cerade, stranice, čekrci i točkovi.",
    image: "/images/kategorije/prikolice.jpg",
  },
  delovi: {
    label: "Rezervni delovi",
    description:
      "Preko 4.900 delova za plugove, roto drljače, tanjirače, freze, setvospremače, drljače, agregate, sejalice i vadilice — za sve poznate brendove.",
    image: "/images/delovi.jpg",
  },
};

/* -------------------------------- Pomoćno --------------------------------- */

/**
 * Link ka ponudi za jednu karticu sa početne strane / iz futera.
 *
 * Grane mašina i prikolice imaju svoje stranice sa pločicama (`/masine/grana/…`,
 * `/prikolice`) — tamo se bira po slici, a filteri dolaze tek u sledećem koraku.
 * Delovi su zasebna vrsta kataloga; sve ostalo je tip mašine, pa ide u filter.
 */
export function catalogHref(categoryKey: string): string {
  if (categoryKey === "delovi") return "/proizvodi?vrsta=delovi";
  if (categoryKey === "prikolice") return "/prikolice";
  if ((granaKljucevi as string[]).includes(categoryKey)) {
    return `/masine/grana/${categoryKey}`;
  }
  return `/proizvodi?vrsta=masine&tip=${categoryKey}`;
}

/** „Daska Överum” → „daska overum” (za pretragu bez dijakritike). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // razlaže „č” na „c” + kombinujući akcenat, koji zatim brišemo
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/ł/g, "l");
}

/**
 * SEO-slug proizvoda: „Tanjirača Field BT" + 4396 → „tanjiraca-field-bt-4396".
 * Živi ovde (a ne u `products.ts`) da bi ga smele koristiti i klijentske
 * komponente kataloga — bez uvlačenja `parts.json` u bundle.
 */
export function productSlug(name: string, id: string): string {
  const base = normalize(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return `${base}-${id}`;
}

/** Iz slug-a vadi id proizvoda (poslednja grupa cifara). */
export function idFromSlug(slug: string): string | null {
  return slug.match(/-(\d+)$/)?.[1] ?? null;
}

/** Putanja do detaljne stranice proizvoda. */
export const productPath = (item: { id: string; name: string }) =>
  `/proizvod/${productSlug(item.name, item.id)}`;

/* -------------------------------- Mašine ---------------------------------- */

type MachineRow = {
  id: string;
  name: string;
  group: string;
  /** Grana — poljoprivredne / šumske / građevinske. */
  grana: keyof typeof GRANE;
  subgroup: string;
  tagline: string;
  brand: string;
};

/** Nazivi tipova mašina — dolaze iz podele grana (`machine-groups.json`). */
const MACHINE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  granaKljucevi.flatMap((k) => Object.entries(GRANE[k].tipovi)),
);

/** Nazivi grana za fasetu „Vrsta posla". */
const MACHINE_BRANCH_LABELS: Record<string, string> = Object.fromEntries(
  granaKljucevi.map((k) => [k, GRANE[k].label]),
);

/** Marke mašina — isti spisak kao `MACHINE_BRANDS` u `lib/products.ts`. */
const MACHINE_BRAND_LABELS: Record<string, string> = { hofman: "Hofman" };

export const machines: CatalogItem[] = (machinesJson as MachineRow[]).map((m) => ({
  id: m.id,
  type: "masine",
  name: m.name,
  tagline: m.tagline,
  brand: MACHINE_BRAND_LABELS[m.brand] ?? m.brand,
  // Samo prava fotografija; bez nje kartica pokazuje brendiran placeholder.
  image: productImages[m.id],
  facets: { tip: m.subgroup, grana: m.grana },
  // U indeks pretrage ulaze i naziv tipa i naziv grane — kupac koji ukuca
  // „šumske mašine" mora da dobije cepače i prikolice, iako te dve reči ne
  // stoje ni u jednom nazivu modela.
  search: normalize(
    [m.name, m.tagline, tipLabel(m.subgroup) ?? "", GRANE[m.grana]?.label ?? ""].join(" "),
  ),
}));

/* ------------------------------ Auto-prikolice ----------------------------- */

/** Red iz `trailers.json` — popunjava `npm run prikolice`. */
type TrailerRow = {
  id: string;
  /** Prikolica ili dodatna oprema za prikolice — dele isti katalog. */
  vrsta: "prikolica" | "oprema";
  model: string;
  name: string;
  tagline: string;
  /** Tehnički opis (samo oprema — ona nema tabelu specifikacije). */
  note?: string;
  image?: string;
  facets: Record<string, string>;
  specs: [string, string][];
};

// `specs` je u JSON-u običan niz nizova, pa ide preko `unknown` do parova.
export const trailerRows = trailersJson as unknown as TrailerRow[];

/**
 * Programi prikolica. Uz oznaku ide i namena, jer „MARINE 1300” samo za sebe
 * kupcu ne znači ništa — koristi se na kategorijskim stranicama i u opisima.
 *
 * `kratko` je ista informacija u tri-četiri reči, za pločice na `/prikolice`:
 * tamo kupac bira po fotografiji („treba mi za čamac”), pa mu ispod slike stoji
 * samo potvrda da je pogodio, a ne cela rečenica.
 */
export const TRAILER_PROGRAMS: Record<
  string,
  { oznaka: string; namena: string; kratko: string }
> = {
  uno: {
    oznaka: "UNO",
    namena: "osnovna prikolica sa stranicama",
    kratko: "Osnovna, sa stranicama",
  },
  light: {
    oznaka: "LIGHT",
    namena: "otvorena prikolica sa stranicama, do 750 kg",
    kratko: "Za svakodnevni prevoz, do 750 kg",
  },
  plato: {
    oznaka: "PLATO",
    namena: "platforma bez stranica",
    kratko: "Ravna platforma, za duži teret",
  },
  cargo: {
    oznaka: "CARGO",
    namena: "veća prikolica sa kočionim sistemom",
    kratko: "Veći teret, sa kočnicama",
  },
  transporter: {
    oznaka: "TRANSPORTER",
    namena: "prevoz vozila",
    kratko: "Za prevoz automobila",
  },
  craft: {
    oznaka: "CRAFT",
    namena: "prevoz građevinskih mašina, sa rampama",
    kratko: "Za mašine, sa rampama",
  },
  marine: {
    oznaka: "MARINE",
    namena: "prevoz plovila",
    kratko: "Za čamac i jet-ski",
  },
  moto: {
    oznaka: "MOTO",
    namena: "prevoz motocikala",
    kratko: "Za motocikl i kvad",
  },
};

/** Grupe dodatne opreme — ključ nosi prefiks `oprema-` da se ne meša sa programima. */
const TRAILER_ACCESSORY_GROUPS: Record<string, string> = {
  "oprema-dodatne-stranice": "Dodatne stranice",
  "oprema-cerade": "Cerade",
  "oprema-konstrukcije-za-cerade": "Konstrukcije za cerade",
  "oprema-nosaci-rezervnog-tocka-i-tockovi": "Nosači rezervnog točka i točkovi",
  "oprema-potporni-tockovi-stabilizatori-i-stezaljke": "Potporni točkovi i stabilizatori",
  "oprema-amortizeri-i-mehanizmi-za-kipovanje": "Amortizeri i mehanizmi za kipovanje",
  "oprema-cekrci-i-nosaci-cekrka": "Čekrci i nosači čekrka",
  "oprema-nosac-za-motocikl-i-bocne-trake-za-pricvrscivanje": "Nosači za motocikl i trake",
  "oprema-ostalo": "Ostala oprema",
};

/**
 * Prikolice i oprema. Fajl je mali (181 stavka, bez teksta opisa), pa za razliku
 * od `parts.json` sme pravo u bundle — bez `loadParts()` odlaganja.
 *
 * Redosled: po ceni od najniže, „na upit" na kraju (vidi `poCeni`). Spiskovi
 * programa (`PrikoliceFilter`) samo filtriraju ovaj niz, pa ga nasleđuju.
 */
export const trailers: CatalogItem[] = poCeni(trailerRows.map((t) => ({
  id: t.id,
  type: "prikolice",
  name: t.name,
  tagline: t.tagline,
  image: t.image,
  facets: t.facets,
  cena: cenaPrikolice(t.id) ?? undefined,
  // „prikolica za auto”, „prikolica za čamac”, „vesta light 23”, „cerada” —
  // narodni pojmovi ulaze u indeks pretrage iako se nigde ne prikazuju.
  search: normalize(
    [
      t.name,
      t.model,
      t.tagline,
      t.note ?? "",
      TRAILER_BRAND.label,
      TRAILER_PROGRAMS[t.facets.program]?.namena ?? "",
      TRAILER_ACCESSORY_GROUPS[t.facets.program] ?? "",
      "prikolica prikolice auto prikolica prikolica za auto",
    ].join(" "),
  ),
})));

/**
 * Prikolice pre opreme dok korisnik nije ništa filtrirao — opreme ima skoro
 * dvaput više, pa bi inače prvi ekran kataloga bio pun čekrka i blatobrana.
 * Isti razlog i isti obrazac kao `popularFirst` kod delova.
 */
export function trailersFirst(items: CatalogItem[]): CatalogItem[] {
  const prikolice: CatalogItem[] = [];
  const oprema: CatalogItem[] = [];
  for (const item of items) {
    (item.facets.tip === "oprema" ? oprema : prikolice).push(item);
  }
  return [...prikolice, ...oprema];
}

/**
 * Stari (i narodni) nazivi tipova delova — ulaze SAMO u indeks pretrage, ne
 * prikazuju se nigde. Katalog koristi terminologiju sa terena („raonik”,
 * „daska”, „deflektor”…), ali kupac koji ukuca „lemeš” ili „plužna daska” mora
 * i dalje da nađe isti deo.
 */
const TYPE_SYNONYMS: Record<string, string> = {
  lemes: "lemeš lemes",
  "raonik-predpluznjaka": "lemeš predplužnjak predplužnjaka raonik",
  daska: "plužna daska",
  "daska-predpluznjaka": "predplužna daska predplužnjak daska",
  lajsna: "lajsna daske ažurna lajsna nastavak",
  resetka: "rešetka resetka ažurna lajsna traka daske letva rešetkaste daske",
  "dugi-plaz": "plaz dugi plaz",
  "kratki-plaz": "plaz kratki plaz",
  "prednji-plaz": "plaz prednji plaz",
  "prednji-deo-plaza": "plaz prednji deo plaza",
  "obloga-plaza": "plaz obloga nalegač",
  "nozasto-crtalo": "crtalo nož nožasto crtalo",
  "nosac-deflektora": "držač deflektora nosač odsecač",
  dleto: "dleto",
  odsecac: "odsecač busena",
  gredelj: "gredelj",
  // Roto drljače: kupac kuca i „rotodrljača”, i „roto drljača”, i „rotaciona drljača”.
  // Noževi i klinovi su jedan tip (isti potrošni deo pod dva imena), pa obe reči
  // moraju da vode na isti spisak.
  "noz-roto-drljace": "rotodrljača rotodrljace rotaciona drljača nož noževi klin klinovi zub",
  "cistac-valjka": "rotodrljača rotodrljace čistač valjka strugač",
  "lezaj-roto-drljace": "rotodrljača rotodrljace ležaj",
  "kuciste-lezaja": "rotodrljača rotodrljace kućište ležaja",
  osovinica: "rotodrljača rotodrljace osovinica bolcna svornjak",
  "zastita-noza": "rotodrljača rotodrljace zaštita noža",
  // Drljače i freze.
  "klin-drljace": "drljača drljace brana klin klinovi zub pačja noga",
  "noz-freze": "freza freze rotofreza nož noževi motika",
  // Setvospremači — „S-pero” i „S-opruga” su ista stvar, po krajevima Srbije.
  "s-opruga": "setvospremač setvospremac S opruga S pero opruge pera",
  "drzac-s-opruge": "setvospremač držač nosač S opruge S pera",
  "nozic-s-opruge": "setvospremač nožić nožići S opruge S pera motičica",
  "pojacanje-s-opruge": "setvospremač pojačanje ojačanje S opruge",
  "ponistivac-tragova": "setvospremač poništavač poništivač brisač tragova točka",
  // Tanjirače.
  "disk-tanjirace": "tanjirača tanjirace disk diskovi tanjir tanjiri nazubljeni",
  "lezaj-tanjirace": "tanjirača tanjirace ležaj drveni ležaj",
  odstojnik: "tanjirača tanjirace odstojnik distancer čaura",
  "osovina-tanjirace": "tanjirača tanjirace osovina vratilo",
  prirubnica: "tanjirača tanjirace prirubnica protivploča",
  "strugac-tanjirace": "tanjirača tanjirace strugač čistač diskova",
  zavrtanj: "zavrtanj šraf vijak matica navrtka",
};

/* --------------------------- Najtraženiji delovi --------------------------- */

/** Deo iz `popular.json` — nosi i gotove oznake za karticu. */
export type PopularPart = CatalogItem & { tags: string[] };

type PopularRow = {
  id: string;
  name: string;
  image: string;
  facets: Record<string, string>;
  tags: string[];
};

/**
 * Najtraženiji delovi za plugove — po jedan komad za svaku kombinaciju
 * brend + tip dela, sa pravom fotografijom. Mali fajl (~24 stavke) pa sme i u
 * klijentski bundle: koristi ga početna strana i katalog PRE filtriranja, gde
 * `parts.json` još nije učitan. Popunjava ga `npm run plugovi`
 * (vidi scripts/import-plow-parts.mjs).
 */
export const popularParts: PopularPart[] = (popularJson as PopularRow[]).map((p) => ({
  id: p.id,
  type: "delovi",
  name: p.name,
  image: p.image,
  facets: p.facets,
  search: normalize(
    `${p.name} ${p.tags.join(" ")} ${TYPE_SYNONYMS[p.facets.tip] ?? ""}`,
  ),
  tags: p.tags,
}));

/** Redosled najtraženijih delova, `id` → mesto u listi (0 = prvi). */
const popularRank = new Map(popularParts.map((p, i) => [p.id, i]));

/**
 * Najtraženiji delovi na početak, ostatak nepromenjen — za prvi ekran kataloga,
 * dok korisnik nije ništa filtrirao. Bez ovoga prvih 24 rezultata su prosto
 * delovi sa najvećim id-em, što nikome ništa ne znači.
 */
export function popularFirst(items: CatalogItem[]): CatalogItem[] {
  const top: CatalogItem[] = [];
  const rest: CatalogItem[] = [];
  for (const item of items) (popularRank.has(item.id) ? top : rest).push(item);
  top.sort((a, b) => popularRank.get(a.id)! - popularRank.get(b.id)!);
  return [...top, ...rest];
}

/* -------------------------------- Delovi ---------------------------------- */

/** Kolonarni format iz `scripts/build-catalog.mjs` — vidi `pack()` tamo. */
type PackedParts = {
  groups: { key: string; label: string }[];
  types: { key: string; label: string }[];
  brands: { key: string; label: string }[];
  sides: { key: string; label: string }[];
  /** [id, naziv, grupa, tip, brend, strana] — poslednja 4 su indeksi, -1 = nema. */
  items: [string, string, number, number, number, number][];
};

let partsCache: CatalogItem[] | null = null;

/**
 * Učitava katalog delova na zahtev. Poziva se tek kad korisnik izabere
 * „Rezervni delovi”, pa početno učitavanje stranice ostaje lagano.
 */
export async function loadParts(): Promise<CatalogItem[]> {
  if (partsCache) return partsCache;

  const packed = (await import("@/data/parts.json")).default as unknown as PackedParts;
  const at = (table: { key: string; label: string }[], i: number) =>
    i >= 0 ? table[i] : undefined;

  partsCache = packed.items.map(([id, name, g, t, b, s]) => {
    const group = at(packed.groups, g);
    const type = at(packed.types, t);
    const brand = at(packed.brands, b);
    const side = at(packed.sides, s);

    return {
      id,
      type: "delovi" as const,
      name,
      // Delovi nemaju rezervnu ilustraciju — red prikazuje ikonicu kad slike nema.
      image: productImages[id],
      facets: {
        ...(group && { grupa: group.key }),
        ...(type && { tip: type.key }),
        ...(brand && { brend: brand.key }),
        ...(side && { strana: side.key }),
      },
      search: normalize(
        `${name} ${brand?.label ?? ""} ${type?.label ?? ""} ${group?.label ?? ""} ${
          type ? TYPE_SYNONYMS[type.key] ?? "" : ""
        }`,
      ),
    };
  });

  PART_LABELS.grupa = Object.fromEntries(packed.groups.map((g) => [g.key, g.label]));
  PART_LABELS.tip = Object.fromEntries(packed.types.map((t) => [t.key, t.label]));
  PART_LABELS.brend = Object.fromEntries(packed.brands.map((b) => [b.key, b.label]));
  PART_LABELS.strana = Object.fromEntries(packed.sides.map((s) => [s.key, s.label]));

  return partsCache;
}

/** Popunjava se u `loadParts()` — do tada je prazno, kao i sam katalog delova. */
const PART_LABELS: Record<string, Record<string, string>> = {};

/* ------------------------------ Opcije fasete ------------------------------ */

const MACHINE_LABELS: Record<string, Record<string, string>> = {
  tip: MACHINE_TYPE_LABELS,
  grana: MACHINE_BRANCH_LABELS,
};

/**
 * Oznake fasete prikolica. Mase se izvode iz samih podataka, pa novi model sa
 * nekom drugom masom ne traži izmenu ove tabele.
 */
const TRAILER_LABELS: Record<string, Record<string, string>> = {
  tip: { prikolica: "Prikolice", oprema: "Dodatna oprema" },
  program: {
    ...Object.fromEntries(
      Object.entries(TRAILER_PROGRAMS).map(([key, p]) => [key, p.oznaka]),
    ),
    ...TRAILER_ACCESSORY_GROUPS,
  },
  masa: Object.fromEntries(
    [...new Set(trailers.map((t) => t.facets.masa).filter(Boolean))].map((key) => [
      key,
      `${key} kg`,
    ]),
  ),
  // Množina — ovo su nazivi filtera („Jednoosovinske”), a ne opis jednog modela.
  osovine: { jednoosovinske: "Jednoosovinske", dvoosovinske: "Dvoosovinske" },
};

/** Čitljiv naziv jedne vrednosti fasete, npr. („delovi”, „brend”, „lemken”) → „Lemken”. */
export function facetLabel(type: CatalogType, facetKey: string, value: string): string {
  const table =
    type === "masine"
      ? MACHINE_LABELS
      : type === "prikolice"
        ? TRAILER_LABELS
        : PART_LABELS;
  return table[facetKey]?.[value] ?? value;
}

/**
 * Gradi opcije za jednu fasetu, sa brojem pogodaka.
 *
 * Broji se nad proizvodima filtriranim po SVIM ostalim fasetama, ali ne i po
 * ovoj — tako korisnik vidi koliko bi rezultata dobio kad bi dodao još jednu
 * čekiranu opciju, umesto svuda nule.
 */
export function facetOptions(
  items: CatalogItem[],
  type: CatalogType,
  facetKey: string,
  selection: Record<string, string[]>,
  query: string,
): FacetOption[] {
  const others = { ...selection };
  delete others[facetKey];
  const pool = filterItems(items, others, query);

  const counts = new Map<string, number>();
  for (const item of pool) {
    const value = item.facets[facetKey];
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  // Izabrane opcije ostaju vidljive i kad im broj padne na nulu.
  for (const value of selection[facetKey] ?? []) {
    if (!counts.has(value)) counts.set(value, 0);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: facetLabel(type, facetKey, value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "sr"));
}

/* -------------------------------- Filtriranje ------------------------------ */

/** Faseta bez izabranih opcija ne filtrira; unutar fasete važi ILI, između fasete I. */
export function filterItems(
  items: CatalogItem[],
  selection: Record<string, string[]>,
  query: string,
): CatalogItem[] {
  const active = Object.entries(selection).filter(([, values]) => values.length > 0);
  const terms = normalize(query).split(/\s+/).filter(Boolean);

  if (active.length === 0 && terms.length === 0) return items;

  return items.filter((item) => {
    for (const [key, values] of active) {
      if (!values.includes(item.facets[key])) return false;
    }
    return terms.every((term) => item.search.includes(term));
  });
}

/* -------------------------------- Redosled -------------------------------- */

/** `CatalogItem` tip dela drži u fasetama — vidi `lib/redosled.ts`. */
const zaRedosled = (item: CatalogItem): ZaRedosled => ({
  name: item.name,
  image: item.image,
  typeKey: item.facets.tip,
});

/**
 * Propisani redosled kataloga — obični delovi pre predplužnjakovih, unutar toga
 * crteži pre fotografija pre onih bez slike. Primenjuje se posle SVAKOG
 * filtriranja, uključujući i pretragu po tekstu.
 */
export const poredajStavke = (items: CatalogItem[]): CatalogItem[] =>
  poredaj(items, zaRedosled);
