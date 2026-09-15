import cenovnikJson from "@/data/trailer-prices.json";

/**
 * Cenovnik auto-prikolica i opreme — JAVAN podatak.
 *
 * Do 15. 9. 2026. cene su bile samo za vlasnika (`/admin/cene`). Onda je Google
 * Search Console prijavio svaki `Product` bez `offers` kao neispravan za rich
 * results („Either offers, review, or aggregateRating should be specified"),
 * a jedina cena koju smemo da tvrdimo je baš ova — vlasnik je odlučio da se
 * cene prikolica objave. Delovi i mašine ostaju „na upit", pa za njih `offers`
 * i dalje nema (vidi `ProductJsonLd`).
 *
 * Modul nema ništa serversko, pa sme i u klijentski bundle (kartice u
 * `PrikoliceFilter`): fajl je ~180 brojeva.
 *
 * ODAKLE: `src/data/trailer-prices.json`, puni ga `npm run cene`
 * (`scripts/import-trailer-prices.mjs`) sa proizvođačevog sajta. Iznosi su u
 * dinarima, onako kako ih izvor objavljuje; ono što izvor vodi po upitu ovde
 * nema unos.
 */

type Cenovnik = {
  valuta: string;
  azurirano?: string;
  izvor?: string;
  cene: Record<string, number>;
};

export const CENOVNIK = cenovnikJson as Cenovnik;

/** Cena po kataloškom broju, ili `null` kad je proizvod na upit. */
export const cenaPrikolice = (id: string): number | null => CENOVNIK.cene[id] ?? null;

/**
 * „85040” → „85.040”.
 *
 * Ručno, a ne `toLocaleString("sr-RS")`, iz dva razloga: server (Node ICU) i
 * pregledač ne moraju da grupišu hiljade istim znakom, pa bi se React žalio na
 * neslaganje pri hidraciji; i cenovnik se ovako ispisuje isto na svakoj mašini.
 */
export const dinara = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** „85040” → „85.040 RSD” — jedan oblik za karticu, stranicu i admin tabelu. */
export const ispisCene = (n: number) => `${dinara(n)} ${CENOVNIK.valuta}`;

/** „2026-09-10” → „10.09.2026.” — datum stanja cenovnika. */
export function datumCenovnika(): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(CENOVNIK.azurirano ?? "");
  return m ? `${m[3]}.${m[2]}.${m[1]}.` : null;
}

/**
 * Kopija liste poređana po ceni, od najniže — vlasnikov zahtev za spiskove
 * prikolica. Stavke bez cene (na upit) idu na kraj; sortiranje je stabilno, pa
 * unutar iste cene i među „na upit" ostaje zatečeni redosled.
 */
export function poCeni<T extends { cena?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.cena == null) return b.cena == null ? 0 : 1;
    if (b.cena == null) return -1;
    return a.cena - b.cena;
  });
}
