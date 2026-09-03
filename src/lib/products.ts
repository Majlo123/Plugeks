/**
 * Serverski model proizvoda — jedinstveni pogled na mašine i delove za
 * pojedinačne stranice `/proizvod/[slug]` i za sitemap.
 *
 * Ovaj modul se učitava SAMO na serveru (u server komponentama, generateMetadata,
 * generateStaticParams i sitemap-u). Zato sme da statički uveze i `parts.json`
 * (~300 KB) — taj teret nikad ne ode u pretraživač. Klijentski katalog i dalje
 * koristi lazy `loadParts()` iz `@/lib/catalog`.
 *
 * Sav opisni tekst ovde je originalan (napisan za PlugekS) — ne prevodi se sa
 * izvornog sajta.
 */

import machinesJson from "@/data/machines.json";
import packedParts from "@/data/parts.json";
import imagesJson from "@/data/images.json";
import machineImagesJson from "@/data/machine-images.json";
import { categories } from "@/lib/data";
import { productSlug, idFromSlug } from "@/lib/catalog";

// Ručne slike mašina gaze generisanu mapu — vidi komentar u lib/catalog.ts.
const productImages: Record<string, string> = {
  ...(imagesJson as Record<string, string>),
  ...(machineImagesJson as Record<string, string>),
};

/* ---------------------------------- Model ---------------------------------- */

export type ProductKind = "masina" | "deo";

export type Product = {
  kind: ProductKind;
  id: string;
  slug: string;
  name: string;
  /** Kratak podnaslov (mašine). */
  tagline?: string;
  /** Lokalna putanja do fotografije ako postoji. */
  image?: string;
  /** Ključ + naziv kategorije (grupe) za breadcrumb i filter. */
  groupKey: string;
  groupLabel: string;
  /** Tip — za mašine „podgrupa" (tanjirace…), za delove tip dela (lemes…). */
  typeKey?: string;
  typeLabel?: string;
  brandKey?: string;
  brandLabel?: string;
  sideKey?: string;
  sideLabel?: string;
};

/* ------------------------------- Slug helpers ------------------------------ */

// productSlug / idFromSlug žive u catalog.ts (klijent-safe); ovde ih re-exportujemo.
export { productSlug, idFromSlug };

export const productHref = (p: Product) => `/proizvod/${p.slug}`;

/* -------------------------------- Mašine ---------------------------------- */

type MachineRow = {
  id: string;
  name: string;
  group: string;
  subgroup: string;
  tagline: string;
  brand: string;
};

const CATEGORY_BY_KEY = Object.fromEntries(categories.map((c) => [c.key, c]));

const MACHINE_TYPE_LABELS: Record<string, string> = {
  tanjirace: "Tanjirača",
  agregati: "Agregat",
  podrivaci: "Podrivač",
  valjci: "Valjak",
  ostalo: "Mašina",
};

function buildMachine(m: MachineRow): Product {
  return {
    kind: "masina",
    id: m.id,
    slug: productSlug(m.name, m.id),
    name: m.name,
    tagline: m.tagline,
    // Samo PRAVA fotografija proizvoda; bez nje → brendiran placeholder (ne
    // generička traktor-slika koja pogrešno predstavlja mašinu).
    image: productImages[m.id],
    groupKey: m.subgroup,
    groupLabel: CATEGORY_BY_KEY[m.subgroup]?.label ?? "Mašine",
    typeKey: m.subgroup,
    typeLabel: MACHINE_TYPE_LABELS[m.subgroup] ?? "Mašina",
    brandKey: "rolland",
    brandLabel: "Rolland",
  };
}

/* -------------------------------- Delovi ---------------------------------- */

type PackedParts = {
  groups: { key: string; label: string }[];
  types: { key: string; label: string }[];
  brands: { key: string; label: string }[];
  sides: { key: string; label: string }[];
  items: [string, string, number, number, number, number][];
};

function buildPart(
  row: [string, string, number, number, number, number],
  tables: PackedParts,
): Product {
  const [id, name, g, t, b, s] = row;
  const at = <T,>(table: T[], i: number) => (i >= 0 ? table[i] : undefined);
  const group = at(tables.groups, g);
  const type = at(tables.types, t);
  const brand = at(tables.brands, b);
  const side = at(tables.sides, s);

  return {
    kind: "deo",
    id,
    slug: productSlug(name, id),
    name,
    image: productImages[id],
    groupKey: group?.key ?? "delovi",
    groupLabel: group?.label ?? "Rezervni delovi",
    typeKey: type?.key,
    typeLabel: type?.label,
    brandKey: brand?.key,
    brandLabel: brand?.label,
    sideKey: side?.key,
    sideLabel: side?.label,
  };
}

/* ------------------------------- Indeksi ---------------------------------- */

let cache: {
  all: Product[];
  byId: Map<string, Product>;
  bySlug: Map<string, Product>;
} | null = null;

function build() {
  if (cache) return cache;

  const machines = (machinesJson as MachineRow[]).map(buildMachine);
  const tables = packedParts as unknown as PackedParts;
  const parts = tables.items.map((row) => buildPart(row, tables));

  const all = [...machines, ...parts];
  const byId = new Map<string, Product>();
  const bySlug = new Map<string, Product>();
  for (const p of all) {
    byId.set(p.id, p);
    bySlug.set(p.slug, p);
  }

  cache = { all, byId, bySlug };
  return cache;
}

export function getAllProducts(): Product[] {
  return build().all;
}

export function getMachines(): Product[] {
  return build().all.filter((p) => p.kind === "masina");
}

/**
 * Proizvodi koji imaju PRAVU fotografiju (a ne ilustraciju kategorije) — za
 * image sitemap. Prazno dok se ne popuni `public/images/rolland/` + images.json
 * (vidi `npm run slike`).
 */
export function getProductsWithPhotos(): Product[] {
  const realIds = new Set(Object.keys(productImages));
  return build().all.filter((p) => realIds.has(p.id));
}

/** Traži po canonical slug-u; ako se ne poklopi, pokušava po id-u iz slug-a. */
export function getProductBySlug(slug: string): Product | undefined {
  const { bySlug, byId } = build();
  const exact = bySlug.get(slug);
  if (exact) return exact;
  const id = idFromSlug(slug);
  return id ? byId.get(id) : undefined;
}

/**
 * Srodni proizvodi za dno stranice. Bira iste kategorije/tipa, pa istog brenda,
 * uz stabilan (deterministički) redosled — bez `Math.random`.
 */
export function relatedProducts(p: Product, limit = 4): Product[] {
  const { all } = build();
  const score = (o: Product) => {
    if (o.id === p.id) return -1;
    if (o.kind !== p.kind) return -1;
    let s = 0;
    if (o.typeKey && o.typeKey === p.typeKey) s += 3;
    if (o.brandKey && o.brandKey === p.brandKey) s += 2;
    if (o.groupKey === p.groupKey) s += 1;
    return s;
  };
  return all
    .map((o) => ({ o, s: score(o) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.o.name.localeCompare(b.o.name, "sr"))
    .slice(0, limit)
    .map((x) => x.o);
}

/* ------------------------------ Opisni tekst ------------------------------ */
/* Originalni srpski tekst pisan za PlugekS — nije prevod izvornog sajta.     */

/** Detaljan opis mašine (po id-u). Piše se ljudski, bez izmišljanja brojki. */
const MACHINE_COPY: Record<string, string> = {
  "4394":
    "Field Hawk BH je hidraulična tanjirača namenjena velikom dnevnom učinku. Hidrauličko sklapanje krila skraćuje pripremu za transport i prelazak između parcela, a agresivan ugao diskova brzo usitnjava žetvene ostatke i priprema zemljište u jednom prohodu.",
  "4396":
    "Field BT je nošena tanjirača za svakodnevnu obradu na malim i srednjim gazdinstvima. Jednostavna je za priključivanje i održavanje, a dobro drži dubinu i ravnomerno meša strnište — dobar izbor za brzu obradu posle žetve.",
  "4395":
    "Field AT je tanjirasti agregat sa zadnjim valjkom koji u jednom prohodu usitni, poravna i delimično zbije zemljište. Time se priprema kvalitetna setvena osnova uz manje prohoda i uštedu goriva.",
  "4575":
    "BH-PA je hidraulična polunošena tanjirača za veće površine. Polunošena konstrukcija sa transportnim točkovima rasterećuje traktor i omogućava stabilan rad pri većim radnim brzinama.",
  "4576":
    "BH-PB je hidraulična polunošena tanjirača građena za intenzivnu obradu većih parcela. Hidrauličko sklapanje i robusan ram omogućavaju siguran transport i pouzdan rad tokom cele sezone.",
  "4577":
    "BTP je polunošena tanjirača velikog kapaciteta. Namenjena je gazdinstvima kojima je bitan učinak po satu — veliki radni zahvat pokriva više hektara dnevno uz stabilan hod.",
  "4692":
    "ATP je polunošeni tanjirasti agregat koji spaja veliki radni zahvat sa stabilnošću polunošene konstrukcije. Kombinacija diskova i valjka daje poravnatu, prozračnu setvenu osnovu.",
  "4703":
    "Grander AB je bezoranični (no-till) agregat za obradu bez prevrtanja plodnog sloja. Radnim telima rastresa i meša zemljište uz očuvanje vlage i strukture — osnova sistema konzervacijske obrade.",
  "4704":
    "Grander ABL je laka verzija bezoraničnog agregata prilagođena manjim traktorima. Omogućava plitku obradu strništa i mešanje žetvenih ostataka uz manju potrošnju snage.",
  "4705":
    'Deeper GBK "Kret" je podrivač za razbijanje tabana pluga i poboljšanje drenaže zemljišta. Radi u dubini bez prevrtanja sloja, čime se obnavlja propusnost za vodu i vazduh i podstiče razvoj korena.',
  "4706":
    'Deeper GBM "Michel" je podrivač za dubinsko rastresanje zbijenih slojeva. Bez prevrtanja plodnog sloja probija zbijeni taban i vraća zemljištu prozračnost — pogodan pred setvu okopavina.',
  "4397":
    "Valjci za obradu zemljišta služe za poravnavanje i zbijanje površine posle obrade i za razbijanje grudvi. Biraju se prema tipu zemljišta i kombinuju sa agregatima i tanjiračama.",
};

/** Vraća opis mašine; ako specifičan ne postoji, gradi solidan podrazumevani. */
export function machineDescription(p: Product): string {
  return (
    MACHINE_COPY[p.id] ??
    `${p.name} je ${(p.typeLabel ?? "mašina").toLowerCase()} iz Rolland programa za obradu zemljišta. Recite nam veličinu parcela i traktor kojim raspolažete i preporučujemo odgovarajuću konfiguraciju.`
  );
}

/** Ključne prednosti mašine po tipu — kratke, iskrene stavke (bez brojki). */
export function machineHighlights(p: Product): string[] {
  const common = [
    "Garancija i obezbeđeni rezervni delovi",
    "Mogućnost kupovine preko subvencija i na rate",
    "Isporuka širom Srbije i regiona",
  ];
  const byType: Record<string, string[]> = {
    tanjirace: ["Brza obrada strništa u jednom prohodu", "Ravnomerno mešanje žetvenih ostataka"],
    agregati: ["Priprema setvene osnove uz manje prohoda", "Ušteda goriva i vremena"],
    podrivaci: ["Razbijanje tabana pluga bez prevrtanja sloja", "Bolja drenaža i razvoj korena"],
    valjci: ["Poravnavanje i zbijanje površine", "Kombinuju se sa agregatima i tanjiračama"],
  };
  return [...(byType[p.typeKey ?? ""] ?? []), ...common];
}

const GROUP_CONTEXT: Record<string, string> = {
  "delovi-plugovi": "plugove",
  "delovi-agregati": "agregate i grubere",
  "delovi-tanjirace": "tanjirače",
  "delovi-sejalice": "sejalice",
  "delovi-vadilice": "vadilice krompira",
  "delovi-kosacice": "kosačice",
};

/** Originalan, iskren opis rezervnog dela — variran po tipu/brendu/kategoriji. */
export function partDescription(p: Product): string {
  const forMachine = GROUP_CONTEXT[p.groupKey] ?? "poljoprivredne mašine";
  const brand = p.brandLabel && p.brandKey !== "univerzalno"
    ? `Odgovara mašinama proizvođača ${p.brandLabel}.`
    : "Univerzalni deo — javite model mašine da potvrdimo kompatibilnost.";
  const kind = p.typeLabel ? p.typeLabel.toLowerCase() : "rezervni deo";
  return `Rezervni deo (${kind}) za ${forMachine}. ${brand} Radimo sa proverenim dobavljačima; recite nam kataloški broj i model mašine i šaljemo ponudu sa cenom i rokom isporuke isti dan.`;
}

/* --------------------------- Kategorije za SEO ---------------------------- */

/**
 * Rute ispod postoje zato što je `/proizvodi` klijentska komponenta: filtrira u
 * pretraživaču i prikazuje 24 po strani uz dugme „Prikaži još". Googlebot izvrši
 * JS, ali ne klikće dugmad, pa u HTML-u nema nijednog linka ka proizvodu —
 * merenjem: 0 na `/proizvodi`, 16 na početnoj, 4 po proizvodu. Bez ovoga bi
 * ~4400 proizvoda postojalo samo u sitemap-u, bez ijednog internog linka, što
 * Google po pravilu ostavlja u „Discovered – currently not indexed".
 */

export type Kategorija = { key: string; label: string; count: number };

const sortiraj = (a: Kategorija, b: Kategorija) =>
  b.count - a.count || a.label.localeCompare(b.label, "sr");

function prebroj(
  items: Product[],
  kljuc: (p: Product) => string | undefined,
  naziv: (p: Product) => string | undefined,
): Kategorija[] {
  const mapa = new Map<string, Kategorija>();
  for (const p of items) {
    const k = kljuc(p);
    if (!k) continue;
    const postojeci = mapa.get(k);
    if (postojeci) postojeci.count += 1;
    else mapa.set(k, { key: k, label: naziv(p) ?? k, count: 1 });
  }
  return [...mapa.values()].sort(sortiraj);
}

export function getParts(): Product[] {
  return build().all.filter((p) => p.kind === "deo");
}

/** Tipovi delova (raonik, daska, plaz…) — po njima ljudi i pretražuju. */
export function partTypes(): Kategorija[] {
  return prebroj(getParts(), (p) => p.typeKey, (p) => p.typeLabel);
}

/** Brendovi plugova za koje postoje delovi (Lemken, Kuhn, Kverneland…). */
export function partBrands(): Kategorija[] {
  return prebroj(
    getParts().filter((p) => p.brandKey && p.brandKey !== "univerzalno"),
    (p) => p.brandKey,
    (p) => p.brandLabel,
  );
}

/** Podgrupe mašina (tanjirače, agregati, podrivači, valjci). */
export function machineCategories(): Kategorija[] {
  return prebroj(getMachines(), (p) => p.typeKey, (p) => p.typeLabel);
}

export const getPartsByType = (typeKey: string) =>
  getParts().filter((p) => p.typeKey === typeKey);

export const getPartsByBrand = (brandKey: string) =>
  getParts().filter((p) => p.brandKey === brandKey);

export const getMachinesByCategory = (typeKey: string) =>
  getMachines().filter((p) => p.typeKey === typeKey);

/** Koliko proizvoda ide na jednu stranu kataloškog indeksa. */
export const KATALOG_PO_STRANI = 120;

export function katalogBrojStrana(): number {
  return Math.max(1, Math.ceil(getAllProducts().length / KATALOG_PO_STRANI));
}

export function katalogStrana(strana: number): Product[] {
  const start = (strana - 1) * KATALOG_PO_STRANI;
  return getAllProducts().slice(start, start + KATALOG_PO_STRANI);
}
