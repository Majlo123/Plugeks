/**
 * Uvozi NABAVNE CENE auto-prikolica i opreme sa proizvođačevog sajta u
 * `src/data/trailer-prices.json` — fajl koji čita samo interna strana
 * `/admin/cene`.
 *
 *   node scripts/import-trailer-prices.mjs        (ili: npm run cene)
 *
 * ZAŠTO ODVOJENO OD `import-trailers.mjs`: taj skript pravi katalog koji ide u
 * javni build i namerno ne prenosi cene (na sajtu PlugekS radi po upitu). Cene
 * su drugi život podatka — vide se samo prijavljenom vlasniku, menjaju se češće
 * od specifikacija i sme da im se osveži samo ovaj jedan fajl, bez ponovnog
 * skidanja 181 fotografije.
 *
 * ODAKLE CENA: sa stranice proizvoda, iz dva izvora u ovom redu:
 *  1. JSON-LD `Product` → `offers.price` (+ `priceCurrency`),
 *  2. ako JSON-LD javi 0 — prvi neprazan `woocommerce-Price-amount` u HTML-u.
 * Drugi korak je nužan: kod modela sa unapred spakovanom opremom izvor u
 * JSON-LD upiše 0, a na strani prikaže pravu cenu (npr. LIGHT 25 DA → 133.665).
 * Na 14 kontrolnih stranica gde JSON-LD ima cenu, prvi iznos iz HTML-a je bio
 * identičan njoj — zato je bezbedno uzeti ga kad JSON-LD stoji na nuli.
 * Iznosi koji i posle toga ostanu 0 se ne upisuju (izvor ih vodi po upitu).
 *
 * Cena je na izvoru već u dinarima (RSD). Ako se to promeni, skript stane i
 * prijavi, jer se u fajl ne sme upisati mešana valuta.
 *
 * KAKO SE VEZUJE ZA NAŠ KATALOG: `trailers.json` ne pamti slug sa izvora, ali
 * ime fotografije jeste slug (`/images/prikolice/{slug}.jpg`, kod sudara
 * `{grupa}-{slug}`), pa se veza slug → kataloški broj izvodi odatle. Time cena
 * ostaje vezana za proizvod i kad se id-evi pomere dodavanjem novog modela.
 *
 * Drugi prolaz vezuje po NAZIVU: izvor s vremenom premesti proizvod na novi
 * slug (najčešće `…-copy`, WordPress kopija koja je preživela original), pa bi
 * po slug-u ispao bez cene. Vezuje se samo kad naziv pogodi tačno jednu našu
 * stavku bez cene — ostalo se prijavi, ne pogađa.
 *
 * Pokretanje je bezbedno za ponavljanje — fajl se svaki put ispisuje ispočetka.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KATALOG_FILE = resolve(root, "src/data/trailers.json");
const OUT_FILE = resolve(root, "src/data/trailer-prices.json");

const ORIGIN = "https://vesta-trailers.com";
const SITEMAPS = [`${ORIGIN}/product-sitemap1.xml`, `${ORIGIN}/product-sitemap2.xml`];

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Valuta u kojoj se cene vode. Izvor isporučuje RSD; ništa drugo se ne upisuje. */
const VALUTA = "RSD";

/** WordPress kopija proizvoda — slug završava na `-copy`. Ide u drugi prolaz. */
const KOPIJA_RE = /-copy$/;

const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

async function preuzmi(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res;
}

/* ------------------------------ Naš katalog -------------------------------- */

const katalog = JSON.parse(readFileSync(KATALOG_FILE, "utf8"));

/** Ime fotografije je slug sa izvora — to je jedini most do naših id-eva. */
const poSlugu = new Map(
  katalog.map((p) => [p.image.split("/").pop().replace(/\.jpg$/, ""), p]),
);

/** Za poređenje naziva: bez dijakritike, bez razmaka i interpunkcije, malim slovima. */
const DIJAKRITIKA = { č: "c", ć: "c", ž: "z", š: "s", đ: "d" };
const kljucNaziva = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[čćžšđ]/g, (z) => DIJAKRITIKA[z])
    .replace(/[^a-z0-9]/g, "");

/* ------------------------------ Spisak adresa ------------------------------ */

const adrese = new Set();
for (const sitemap of SITEMAPS) {
  const xml = await (await preuzmi(sitemap)).text();
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    if (m[1].includes("/sr/")) adrese.add(m[1]);
  }
}

if (adrese.size === 0) {
  console.error("Sitemap nije vratio nijednu adresu — proveri strukturu izvora.");
  process.exit(1);
}

/**
 * Adresa → slug + grupa. Slug je poslednji segment putanje; kod sudara imena
 * fotografije skript uvoza je prefiksovao grupom, pa se probaju oba oblika.
 * Kopije idu na kraj spiska da original uvek prvi uzme svoju stavku.
 */
const stranice = [...adrese]
  .map((url) => {
    const delovi = new URL(url).pathname.split("/").filter(Boolean);
    const slug = delovi[delovi.length - 1];
    return { url, slug, grupa: delovi[2], kopija: KOPIJA_RE.test(slug) };
  })
  .sort((a, b) => Number(a.kopija) - Number(b.kopija) || a.slug.localeCompare(b.slug));

console.log(`U sitemap-u ${stranice.length} adresa; u katalogu ${katalog.length} stavki.`);

/* --------------------------- Čitanje jedne stranice ------------------------ */

/** Iz stranice vadi `Product` čvor iz JSON-LD grafa. */
function izvuciProizvod(html) {
  for (const m of html.matchAll(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const proizvod = (data["@graph"] ?? [data]).find((n) => n["@type"] === "Product");
    if (proizvod) return proizvod;
  }
  return null;
}

const uBroj = (s) => {
  const n = Number(String(s).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Iz `offers` vadi iznos i valutu. Kod proizvoda sa varijantama izvor umesto
 * jedne ponude vraća `AggregateOffer` ili spisak — tada se uzima najniža cena
 * („od”), jer je to cena osnovne konfiguracije.
 */
function cenaIzJsonLd(proizvod) {
  const ponude = [proizvod?.offers]
    .flat(2)
    .filter(Boolean)
    .flatMap((o) => (o.offers ? [o, ...[o.offers].flat()] : [o]));

  const iznosi = [];
  let valuta = null;
  for (const o of ponude) {
    const broj = uBroj(o.price ?? o.lowPrice ?? "");
    if (broj == null) continue;
    iznosi.push(broj);
    valuta = valuta ?? o.priceCurrency ?? null;
  }
  return iznosi.length > 0 ? { cena: Math.min(...iznosi), valuta } : null;
}

/**
 * Prvi neprazan iznos iz HTML-a. Prvi na strani je cena samog proizvoda; iza
 * njega idu opcioni komadi iz „spakuj svoju prikolicu” tabele, koji stoje na 0
 * dok se ne izaberu — zato se nule preskaču, a ne uzima najmanji iznos.
 */
function cenaIzHtmla(html) {
  for (const m of html.matchAll(
    /woocommerce-Price-amount[^>]*>\s*<bdi>([^<]*)</g,
  )) {
    const broj = uBroj(m[1].replace(/&nbsp;|\s/g, "").replace(/\./g, ""));
    if (broj != null) return broj;
  }
  return null;
}

/** Izvor uz naziv dopisuje ime sajta („LIGHT 15 - Vesta Trailers”). */
const NASTAVAK_RE = /\s*[-–|]\s*Vesta Trailers\s*$/i;

/* --------------------------------- Preuzimanje ------------------------------ */

const cene = {};
const naziviStranica = [];
const bezCene = [];
const drugaValuta = [];
const greske = [];

for (const stranica of stranice) {
  try {
    const html = await (await preuzmi(stranica.url)).text();
    const proizvod = izvuciProizvod(html);
    if (!proizvod) throw new Error("nema JSON-LD Product čvora");

    const izJsonLd = cenaIzJsonLd(proizvod);
    if (izJsonLd?.valuta && izJsonLd.valuta !== VALUTA) {
      drugaValuta.push(`${stranica.slug}: ${izJsonLd.cena} ${izJsonLd.valuta}`);
      continue;
    }

    const cena = izJsonLd?.cena ?? cenaIzHtmla(html);
    const naziv = String(proizvod.name ?? "").replace(NASTAVAK_RE, "").trim();
    const proizvodUKatalogu =
      poSlugu.get(stranica.slug) ?? poSlugu.get(`${stranica.grupa}-${stranica.slug}`);

    if (cena == null) {
      if (proizvodUKatalogu) {
        bezCene.push(`${proizvodUKatalogu.id} ${proizvodUKatalogu.name}`);
      }
      continue;
    }

    /* Prvi prolaz — po slug-u. Kopija ne pregazi cenu koju je original upisao. */
    if (proizvodUKatalogu && cene[proizvodUKatalogu.id] == null) {
      cene[proizvodUKatalogu.id] = Math.round(cena);
    } else if (!proizvodUKatalogu) {
      naziviStranica.push({ naziv, cena: Math.round(cena), slug: stranica.slug });
    }
  } catch (err) {
    greske.push(`${stranica.slug}: ${err.message}`);
  }

  await pauza(250);
}

/* Valuta se ne meša — ako je izvor promenio cenovnik, fajl ostaje neizmenjen. */
if (drugaValuta.length > 0) {
  console.error(
    `\nIzvor vraća cene u drugoj valuti (očekivano ${VALUTA}) — fajl NIJE upisan:`,
  );
  for (const red of drugaValuta) console.error(`  ${red}`);
  process.exit(1);
}

/* ---------------------- Drugi prolaz: vezivanje po nazivu ------------------- */

const vezanoPoNazivu = [];
const nepovezaneStranice = [];

for (const stranica of naziviStranica) {
  const kljuc = kljucNaziva(stranica.naziv);
  const kandidati = katalog.filter((p) => {
    if (cene[p.id] != null) return false;
    const nas = kljucNaziva(p.name);
    return nas === kljuc || nas.endsWith(kljuc);
  });

  if (kandidati.length === 1) {
    cene[kandidati[0].id] = stranica.cena;
    vezanoPoNazivu.push(`${kandidati[0].id} ${kandidati[0].name} ← ${stranica.slug}`);
  } else {
    nepovezaneStranice.push(
      `${stranica.slug} („${stranica.naziv}”, ${stranica.cena}) — ${
        kandidati.length === 0 ? "nema stavku u katalogu" : `${kandidati.length} kandidata`
      }`,
    );
  }
}

/* --------------------------------- Upis ------------------------------------ */

const poredjaneCene = Object.fromEntries(
  Object.keys(cene)
    .sort((a, b) => Number(a) - Number(b))
    .map((id) => [id, cene[id]]),
);

writeFileSync(
  OUT_FILE,
  `${JSON.stringify(
    {
      valuta: VALUTA,
      azurirano: new Date().toISOString().slice(0, 10),
      izvor: ORIGIN,
      cene: poredjaneCene,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

const upisano = Object.keys(poredjaneCene).length;
console.log(
  `\nUpisano ${upisano} od ${katalog.length} cena u ${OUT_FILE.replace(root, "").slice(1)}`,
);

const ispisi = (naslov, redovi) => {
  if (redovi.length === 0) return;
  console.log(`\n${naslov} (${redovi.length}):`);
  for (const red of redovi) console.log(`  ${red}`);
};

ispisi("Vezano po nazivu", vezanoPoNazivu);
ispisi("Izvor vodi po upitu (iznos 0)", bezCene);
ispisi(
  "Bez cene",
  katalog.filter((p) => poredjaneCene[p.id] == null).map((p) => `${p.id} ${p.name}`),
);
ispisi("Stranice koje nemaju stavku u katalogu", nepovezaneStranice);
ispisi("Greške", greske);
