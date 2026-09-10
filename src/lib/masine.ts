import graneJson from "@/data/machine-groups.json";

/**
 * Podela mašina na grane — poljoprivredne, šumske, građevinske.
 *
 * Klijent-safe (kao `catalog.ts`), pa ga smeju i katalog i serverske stranice.
 * Podatke piše `npm run masine` (`scripts/import-hofman.mjs`); ovde se samo
 * čitaju i tipiziraju.
 *
 * ZAŠTO GRANE POSTOJE: dok su mašine bile samo Rolland program za obradu
 * zemljišta, četiri tipa su stala u jedan spisak. Sa uvozom Hofman programa
 * ponuda ima 21 tip mašine u tri sasvim različita posla — kupac koji traži
 * cepač drva nema šta da traži među sejalicama. Grana je zato prvi izbor, tip
 * drugi, mašina treći; dublje se ne ide (izvor ide do četvrtog nivoa i tamo se
 * kupac gubi).
 *
 * Komunalne mehanizacije nema — nije u ponudi. Baštenske mašine su tip unutar
 * poljoprivrednih, ne zasebna grana.
 */

export type GranaKljuc = "poljoprivredne" | "sumske" | "gradjevinske";

export type Grana = {
  label: string;
  /** Kratak naziv za pločicu i značku na kartici („Šumske"). */
  kratko: string;
  opis: string;
  /** Ključ tipa → naziv tipa. Redosled upisa je i redosled prikaza. */
  tipovi: Record<string, string>;
};

export const GRANE = graneJson as Record<GranaKljuc, Grana>;

export const granaKljucevi = Object.keys(GRANE) as GranaKljuc[];

/** Ime tipa mašine („tanjirace" → „Tanjirače"), bez obzira na granu. */
export function tipLabel(tipKey: string): string | undefined {
  for (const grana of Object.values(GRANE)) {
    const naziv = grana.tipovi[tipKey];
    if (naziv) return naziv;
  }
  return undefined;
}

/** Grana kojoj tip pripada — za breadcrumb i značku na kartici. */
export function granaZaTip(tipKey: string): GranaKljuc | undefined {
  return granaKljucevi.find((k) => tipKey in GRANE[k].tipovi);
}

/** Adresa stranice jedne grane. */
export const granaHref = (kljuc: GranaKljuc) => `/masine/grana/${kljuc}`;
