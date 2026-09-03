/**
 * Katalog proizvoda — jedinstveni model za mašine i rezervne delove.
 *
 * Ceo asortiman dolazi sa rolland.pl (generisano skriptom):
 *  - `src/data/machines.json` — mašine
 *  - `src/data/parts.json`    — rezervni delovi, ~4.600 kom
 *
 * Delovi se NE uvoze ovde nego kroz `loadParts()`, da ~300 KB podataka ne bi
 * ulazilo u početni bundle — učita se tek kad korisnik izabere „Rezervni delovi”.
 *
 * Katalog se osvežava sa: `npm run catalog` (vidi scripts/build-catalog.mjs).
 */

import machinesJson from "@/data/machines.json";
import imagesJson from "@/data/images.json";
import machineImagesJson from "@/data/machine-images.json";
import popularJson from "@/data/popular.json";
import { categories } from "@/lib/data";

/**
 * Prave fotografije proizvoda (id proizvoda → lokalna putanja): mašine i delovi
 * sa rolland.pl (`npm run slike`) + crteži delova za plugove
 * (`npm run plugovi`). Bez unosa u mapi kartica pokazuje brendiran placeholder.
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

export type CatalogType = "masine" | "delovi";

export type CatalogItem = {
  id: string;
  type: CatalogType;
  name: string;
  tagline?: string;
  image?: string;
  /** Vrednost po ključu fasete — vidi `FACETS`. */
  facets: Record<string, string>;
  /** Normalizovan tekst za pretragu (bez dijakritike, mala slova). */
  search: string;
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
  masine: [{ key: "tip", label: "Tip mašine", placeholder: "Sve vrste mašina" }],
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
      "Tanjirače, tanjirasti i bezoranični agregati, podrivači i valjci za obradu — kompletne mašine sa garancijom.",
    image: "/images/prikljucne.jpg",
  },
  delovi: {
    label: "Rezervni delovi",
    description:
      "Preko 4.600 delova za plugove, agregate, tanjirače, sejalice i vadilice — za sve poznate brendove.",
    image: "/images/delovi.jpg",
  },
};

/* -------------------------------- Pomoćno --------------------------------- */

/**
 * Link ka katalogu za jednu kategoriju sa početne strane / iz futera.
 * Kategorija „delovi” vodi na katalog delova, sve ostale na mašine.
 */
export function catalogHref(categoryKey: string): string {
  return categoryKey === "delovi"
    ? "/proizvodi?vrsta=delovi"
    : `/proizvodi?vrsta=masine&tip=${categoryKey}`;
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
  subgroup: string;
  tagline: string;
  brand: string;
};

/** Nazivi tipova mašina — podgrupe iz `machines.json`. */
const MACHINE_TYPE_LABELS: Record<string, string> = {
  ostalo: "Ostale mašine",
  ...Object.fromEntries(categories.map((c) => [c.key, c.label])),
};

export const machines: CatalogItem[] = (machinesJson as MachineRow[]).map((m) => ({
  id: m.id,
  type: "masine",
  name: m.name,
  tagline: m.tagline,
  // Samo prava fotografija; bez nje kartica pokazuje brendiran placeholder.
  image: productImages[m.id],
  facets: { tip: m.subgroup },
  search: normalize(`${m.name} ${m.tagline} ${MACHINE_TYPE_LABELS[m.subgroup] ?? ""}`),
}));

/**
 * Stari (i narodni) nazivi tipova delova — ulaze SAMO u indeks pretrage, ne
 * prikazuju se nigde. Katalog koristi terminologiju sa terena („raonik”,
 * „daska”, „deflektor”…), ali kupac koji ukuca „lemeš” ili „plužna daska” mora
 * i dalje da nađe isti deo.
 */
const TYPE_SYNONYMS: Record<string, string> = {
  lemes: "lemeš lemes",
  daska: "plužna daska",
  lajsna: "lajsna daske ažurna lajsna",
  dleto: "dleto",
  odsecac: "odsecač busena",
  gredelj: "gredelj",
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
};

/** Čitljiv naziv jedne vrednosti fasete, npr. („delovi”, „brend”, „lemken”) → „Lemken”. */
export function facetLabel(type: CatalogType, facetKey: string, value: string): string {
  const table = type === "masine" ? MACHINE_LABELS : PART_LABELS;
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
