/**
 * Redosled proizvoda u SVAKOJ listi — katalog, kategorijske stranice, kataloški
 * indeks i „slični proizvodi". Jedno mesto, da se pravilo ne raspiše po deset
 * fajlova i vremenom razmimoiđe.
 *
 * Dva pravila, po važnosti:
 *
 *  1. Deo predplužnjaka ide POSLE običnog dela istog tipa. Katalog ima 212
 *     raonika i 185 dasaka koji su zapravo delovi predplužnjaka — sitni komadi
 *     koji stoje ispred plužnog tela. Kupac koji otvori „Raonik" traži veliki
 *     raonik; sitni ga zanima tek kad ga nije našao, pa ide na dno.
 *
 *  2. Unutar toga: prvo delovi sa sivim tehničkim crtežom, pa Rolland/Vesta
 *     fotografije, pa ono bez slike. Crtež je za deo najkorisniji vizual (vidi
 *     se oblik i mere), a red bez ikakve slike je najslabija kartica u mreži —
 *     takvi ne smeju da drže vrh prvog ekrana.
 *
 * Sortiranje je STABILNO (V8 garantuje), pa unutar istog ranga ostaje zatečeni
 * redosled iz podataka — ništa se ne premešta bez razloga.
 */

/** Sivi crteži delova za plugove — `npm run plugovi`. */
const SIVI_CRTEZ = "/images/plugovi/";

/** Tipovi dela koji su po definiciji delovi predplužnjaka. */
const TIPOVI_PREDPLUZNJAKA = new Set(["predpluznjak", "predpluzna-daska"]);

/** „Raonik predplužnjaka Vogel & Noot…" — ime nosi podatak koji tip ne nosi. */
const IME_PREDPLUZNJAKA = /predplu[žz]/i;

export type ZaRedosled = {
  name: string;
  image?: string;
  /** Ključ tipa dela (`lemes`, `daska`…). Kod mašina i prikolica ga nema. */
  typeKey?: string;
};

/**
 * Rang proizvoda — manji broj ide gore. Desetica nosi pravilo 1, jedinica
 * pravilo 2, pa je poređenje jedno oduzimanje umesto lanca `||`.
 */
export function rang(p: ZaRedosled): number {
  const predpluznjak =
    TIPOVI_PREDPLUZNJAKA.has(p.typeKey ?? "") || IME_PREDPLUZNJAKA.test(p.name);

  const slika = !p.image ? 2 : p.image.startsWith(SIVI_CRTEZ) ? 0 : 1;

  return (predpluznjak ? 10 : 0) + slika;
}

/**
 * Kopija liste u propisanom redosledu. Ne dira original — pozivaoci često
 * sortiraju već memoizovan niz iz `build()`, koji se deli između stranica.
 *
 * `kljuc` postoji zbog kataloškog `CatalogItem`-a, koji tip dela nosi u
 * `facets.tip`; serverski `Product` se poklapa sam sa sobom.
 */
export function poredaj<T>(items: T[], kljuc: (item: T) => ZaRedosled): T[] {
  return [...items].sort((a, b) => rang(kljuc(a)) - rang(kljuc(b)));
}
