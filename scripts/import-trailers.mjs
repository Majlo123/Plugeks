/**
 * Uvozi ceo program auto-prikolica Vesta u naš katalog — svih 8 serija plus
 * dodatnu opremu.
 *
 *   node scripts/import-trailers.mjs        (ili: npm run prikolice)
 *
 * ZAŠTO OVAKO: proizvođačev sajt ima ispravan `product-sitemap`, ali mu je
 * paginacija kategorija polomljena (npr. LIGHT strane 3 i 4 vraćaju 404, pa se
 * kroz sajt vidi 12 od 21 modela). Zato se spisak čita iz sitemap-a. Svaka
 * stranica proizvoda nosi kompletan JSON-LD (`Product`) sa tehničkim podacima i
 * fotografijama — odatle se sve i uzima, bez parsiranja rasporeda stranice.
 *
 * ŠTA RADI:
 *  1. skida spisak svih proizvoda iz oba product-sitemap-a
 *  2. razvrstava ih na prikolice (`/catalog/<serija>/…`) i dodatnu opremu
 *  3. za svaki čita JSON-LD → tehnički podaci + adrese fotografija
 *  4. skida najveću fotografiju u `data/vesta-originals/{slug}.jpg`
 *  5. upisuje `src/data/trailers.json` (id, naziv, fasete, specifikacija)
 *
 * SLIKE ZA SAJT pravi `scripts/normalize_trailer_images.py`
 * (`npm run prikolice:slike`) — ovde se skida samo sirov original. Razlog:
 * izvorne fotografije dolaze u 50 različitih formata (od 157×73 do 2560×1696) i
 * sa 25–100% praznine u kadru, pa bi u mreži kartica jedna prikolica ispunila
 * karticu, a druga plutala kao tačka.
 *
 * ŠTA NAMERNO NE RADI: ne prenosi cene sa izvornog sajta. PlugekS radi po
 * upitu (vidi `offers` u ProductJsonLd) — tuđi cenovnik ovde ne bi bio tačan.
 * Ne prenosi ni marketinški tekst; opis se sastavlja iz specifikacije, u
 * `trailerDescription()` (`src/lib/products.ts`).
 *
 * Fotografije se imenuju po slug-u sa izvora, a NE po kataloškom broju — tako
 * dodavanje novog modela (koje pomera id-eve) ne pomeša slike sa proizvodima.
 * Pokretanje je bezbedno za ponavljanje — već preuzete slike se preskaču.
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGINALS_DIR = resolve(root, "data/vesta-originals");
const IMAGES_DIR = resolve(root, "public/images/prikolice");
const OUT_FILE = resolve(root, "src/data/trailers.json");

const ORIGIN = "https://vesta-trailers.com";
const SITEMAPS = [`${ORIGIN}/product-sitemap1.xml`, `${ORIGIN}/product-sitemap2.xml`];

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Kataloški brojevi: prikolice od 9001, oprema od 9501. Rolland staje na 4790. */
const ID_PRIKOLICE = 9001;
const ID_OPREMA = 9501;

/**
 * Serije prikolica. Redosled je i redosled dodele kataloških brojeva i redosled
 * u faseti — od najlakših ka specijalizovanim.
 *
 * `prefiks` je naša reč ispred fabričke oznake: „MARINE 1300" sam za sebe kupcu
 * ne znači ništa, „Prikolica za plovila MARINE 1300" znači.
 */
const SERIJE = {
  uno: { oznaka: "UNO", prefiks: "Auto-prikolica" },
  light: { oznaka: "LIGHT", prefiks: "Auto-prikolica" },
  plato: { oznaka: "PLATO", prefiks: "Prikolica platforma" },
  cargo: { oznaka: "CARGO", prefiks: "Auto-prikolica" },
  transporter: { oznaka: "TRANSPORTER", prefiks: "Prikolica za vozila" },
  craft: { oznaka: "CRAFT", prefiks: "Prikolica za mašine" },
  marine: { oznaka: "MARINE", prefiks: "Prikolica za plovila" },
  moto: { oznaka: "MOTO", prefiks: "Prikolica za motocikle" },
};

/** Grupe dodatne opreme — ključ je segment iz adrese na izvoru. */
const OPREMA = {
  "dodatne-stranice": "Dodatne stranice",
  cerade: "Cerade",
  "konstrukcije-za-cerade": "Konstrukcije za cerade",
  "nosaci-rezervnog-tocka-i-tockovi": "Nosači rezervnog točka i točkovi",
  "potporni-tockovi-stabilizatori-i-stezaljke": "Potporni točkovi i stabilizatori",
  "amortizeri-i-mehanizmi-za-kipovanje": "Amortizeri i mehanizmi za kipovanje",
  "cekrci-i-nosaci-cekrka": "Čekrci i nosači čekrka",
  "nosac-za-motocikl-i-bocne-trake-za-pricvrscivanje": "Nosači za motocikl i trake",
  ostalo: "Ostala oprema",
};

/**
 * Stranice koje se preskaču — zaostaci na izvoru, ne pravi proizvodi:
 *  - `trailer-moto-500-base` je stub duplikat modela MOTO 500, bez ijednog
 *    tehničkog podatka;
 *  - `cekrk-sa-nosacem-za-light-prikolice-2` stoji u „uncategorized" i identičan
 *    je komadu iz grupe Čekrci (isti naziv, isti opis, ista cena).
 */
const PRESKOCI = new Set([
  "trailer-moto-500-base",
  "cekrk-sa-nosacem-za-light-prikolice-2",
]);

/** WordPress kopija proizvoda — slug uvek završava na `-copy`. */
const KOPIJA_RE = /-copy$/;

const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

async function preuzmi(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res;
}

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
 * Razvrstavanje po adresi:
 *   /sr/catalog/<serija>/<slug>/          → prikolica
 *   /sr/dodatna-oprema/<grupa>/<slug>/    → oprema
 *   /sr/uncategorized-sr/<slug>/          → oprema, grupa „ostalo”
 */
function razvrstaj(url) {
  const delovi = new URL(url).pathname.split("/").filter(Boolean);
  const slug = delovi[delovi.length - 1];
  if (PRESKOCI.has(slug) || KOPIJA_RE.test(slug)) return null;

  if (delovi[1] === "catalog" && SERIJE[delovi[2]]) {
    return { url, slug, vrsta: "prikolica", grupa: delovi[2] };
  }
  if (delovi[1] === "dodatna-oprema") {
    return { url, slug, vrsta: "oprema", grupa: OPREMA[delovi[2]] ? delovi[2] : "ostalo" };
  }
  if (delovi[1] === "uncategorized-sr") {
    return { url, slug, vrsta: "oprema", grupa: "ostalo" };
  }
  return null;
}

const stavke = [...adrese].map(razvrstaj).filter(Boolean);

const brojPrikolica = stavke.filter((s) => s.vrsta === "prikolica").length;
console.log(
  `U sitemap-u: ${brojPrikolica} prikolica + ${stavke.length - brojPrikolica} komada opreme`,
);

/* --------------------------------- Redosled -------------------------------- */

/** „LIGHT 20 W” i „LIGHT 100” — prirodno poređenje, da 100 ne dođe pre 20. */
const prirodno = (a, b) =>
  a.localeCompare(b, "sr", { numeric: true, sensitivity: "base" });

const redSerije = Object.keys(SERIJE);
const redOpreme = Object.keys(OPREMA);

stavke.sort((a, b) => {
  if (a.vrsta !== b.vrsta) return a.vrsta === "prikolica" ? -1 : 1;
  const red = a.vrsta === "prikolica" ? redSerije : redOpreme;
  return red.indexOf(a.grupa) - red.indexOf(b.grupa) || prirodno(a.slug, b.slug);
});

/* ------------------------------ Čitanje stranice ---------------------------- */

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

/** `&#215;` → `×`, `&amp;` → `&`. Izvor mestimično upisuje neraspakovane entitete. */
const raspakuj = (s) =>
  String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");

/** Deo naziva stiže ćirilicom („МОТО 500") — sajt je latinični, pa preslovljavamo. */
const CIRILICA = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Ђ: "Đ", Е: "E", Ж: "Ž", З: "Z", И: "I",
  Ј: "J", К: "K", Л: "L", Љ: "Lj", М: "M", Н: "N", Њ: "Nj", О: "O", П: "P", Р: "R",
  С: "S", Т: "T", Ћ: "Ć", У: "U", Ф: "F", Х: "H", Ц: "C", Ч: "Č", Џ: "Dž", Ш: "Š",
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "đ", е: "e", ж: "ž", з: "z", и: "i",
  ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o", п: "p", р: "r",
  с: "s", т: "t", ћ: "ć", у: "u", ф: "f", х: "h", ц: "c", ч: "č", џ: "dž", ш: "š",
};
const preslovi = (s) => s.replace(/[Ѐ-ӿ]/g, (c) => CIRILICA[c] ?? c);

/** „Light 15 - Vesta Trailers" → „Light 15". */
const ocistiNaziv = (s) =>
  preslovi(raspakuj(s))
    .replace(/\s*[-–—]\s*Vesta\s+Trailers\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

/** `[{ name: "pa_payload", value: "610" }, …]` → `{ payload: "610", … }`. */
function uSlovnik(svojstva) {
  const out = {};
  for (const p of svojstva ?? []) {
    // Izvor ponegde upiše atribut bez vrednosti — takav red se izostavlja.
    if (p?.name == null || p.value == null) continue;
    const v = raspakuj(p.value).trim();
    if (v) out[p.name.replace(/^pa_/, "")] = v;
  }
  return out;
}

const veliko = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * Ispravke vrednosti sa izvora. Za sada samo engleski naziv materijala koji je
 * ostao nepreveden — sve ostalo se prenosi doslovno.
 */
const ISPRAVKE = { aluminum: "Aluminijum" };
const ispravi = (v) => (v ? (ISPRAVKE[v.toLowerCase()] ?? v) : v);

/** `"1519x1130x373"` → `["1519","1130","373"]`; podnosi i raspone („5405-6300"). */
const razloziDimenzije = (v) =>
  v
    ? raspakuj(v)
        .split(/[x×]/i)
        .map((n) => n.trim())
        .filter(Boolean)
    : [];

/** Dimenzije + oznaka osa koje zaista postoje: 2 broja → „(D × Š)", 3 → „(D × Š × V)". */
function redDimenzija(naziv, v) {
  const d = razloziDimenzije(v);
  if (d.length === 0) return null;
  const ose = d.length >= 3 ? "D × Š × V" : d.length === 2 ? "D × Š" : "D";
  return [`${naziv} (${ose})`, `${d.join(" × ")} mm`];
}

/** Prvi broj iz dimenzija u metrima; raspon „5405-6300" uzima gornju vrednost. */
function uMetre(deo) {
  const brojevi = String(deo ?? "").match(/\d+/g);
  if (!brojevi) return null;
  return (Number(brojevi[brojevi.length - 1]) / 1000).toFixed(1).replace(".", ",");
}

/**
 * Tehnička specifikacija — redosled je ujedno i redosled prikaza u tabeli na
 * stranici proizvoda. Vrednosti se ne prevode, samo formatiraju (jedinice,
 * veliko početno slovo). Red bez vrednosti ispada.
 */
const SPECIFIKACIJA = (p) => [
  p.payload && ["Nosivost", `${p.payload} kg`],
  p["empty-trailer-mass"] && ["Masa prazne prikolice", `${p["empty-trailer-mass"]} kg`],
  p["total-mass"] && ["Najveća dozvoljena masa", `${p["total-mass"]} kg`],
  redDimenzija("Tovarni prostor", p["usable-dimensions"]),
  redDimenzija("Spoljne dimenzije", p["trailer-dimensions"]),
  p["loading-height"] && ["Visina utovara", `${p["loading-height"]} mm`],
  p["number-of-axles"] && ["Broj osovina", p["number-of-axles"]],
  p["load-capacity-per-axle"] && ["Nosivost po osovini", `${p["load-capacity-per-axle"]} kg`],
  p["type-of-axles"] && ["Kočioni sistem", veliko(p["type-of-axles"])],
  p.wheels && ["Točkovi", p.wheels],
  p["side-material"] && ["Materijal stranica", ispravi(veliko(p["side-material"]))],
  p["floor-material"] && ["Materijal poda", ispravi(veliko(p["floor-material"]))],
  p["boat-cradle"] && ["Ležište za plovilo", veliko(p["boat-cradle"])],
  p["number-of-motorcycle-mounts"] && [
    "Mesta za motocikl",
    p["number-of-motorcycle-mounts"],
  ],
  p.tipping && ["Kiper (nagibni sanduk)", veliko(p.tipping)],
  p["surface-coating"] && ["Zaštita površine", veliko(p["surface-coating"])],
  p.plug && ["Utikač", p.plug],
];

/* -------------------------------- Preuzimanje ------------------------------ */

mkdirSync(ORIGINALS_DIR, { recursive: true });

const katalog = [];
const zauzetiSlugovi = new Set();
let preuzeto = 0;
let preskoceno = 0;
let bezSlike = 0;
const greske = [];

for (const stavka of stavke) {
  const jePrikolica = stavka.vrsta === "prikolica";

  try {
    const html = await (await preuzmi(stavka.url)).text();
    const proizvod = izvuciProizvod(html);
    if (!proizvod) throw new Error("nema JSON-LD Product čvora");

    const p = uSlovnik(proizvod.additionalProperty);
    const izvorniNaziv = ocistiNaziv(proizvod.name);

    /* ----------------------------- Naziv proizvoda ---------------------------- */

    let naziv;
    let oznaka;
    if (jePrikolica) {
      const serija = SERIJE[stavka.grupa];
      // Fabrička oznaka se piše verzalom („Light 15" → „LIGHT 15"), a serija se
      // iz naziva izbacuje pa vraća — izvor je piše čas verzalom, čas ne.
      const ostatak = izvorniNaziv.replace(new RegExp(`^${serija.oznaka}\\s*`, "i"), "");
      oznaka = `${serija.oznaka}${ostatak ? ` ${ostatak}` : ""}`.trim();
      naziv = `${serija.prefiks} ${oznaka}`;
    } else {
      oznaka = izvorniNaziv;
      naziv = izvorniNaziv;
    }

    /* ------------------------------- Fotografija ------------------------------ */

    // Ime po slug-u sa izvora; na sudar (dve grupe, isti slug) dodaje se grupa.
    let slikaSlug = stavka.slug;
    if (zauzetiSlugovi.has(slikaSlug)) slikaSlug = `${stavka.grupa}-${stavka.slug}`;
    zauzetiSlugovi.add(slikaSlug);

    // PRVA iz galerije je glavna fotografija proizvoda (izvor tako i sortira);
    // ostale su detalji — vučna ruda, pod, brava. Ne bira se najveća po
    // rezoluciji: krupni kadar detalja ume da bude veći fajl od hero snimka, pa
    // bi u katalogu umesto prikolice stajao blatobran.
    const slike = (Array.isArray(proizvod.image) ? proizvod.image : [proizvod.image])
      .map((s) => (typeof s === "string" ? s : s?.url))
      .filter(Boolean);

    const putanja = `/images/prikolice/${slikaSlug}.jpg`;
    const cilj = resolve(ORIGINALS_DIR, `${slikaSlug}.jpg`);
    let imaSliku = existsSync(cilj);

    if (imaSliku) {
      preskoceno++;
    } else if (slike[0]) {
      const res = await preuzmi(slike[0]);
      if (!(res.headers.get("content-type") ?? "").startsWith("image/")) {
        throw new Error("glavna adresa nije slika");
      }
      writeFileSync(cilj, Buffer.from(await res.arrayBuffer()));
      imaSliku = true;
      preuzeto++;
    } else {
      bezSlike++;
    }

    /* -------------------------------- Fasete --------------------------------- */

    const dim = razloziDimenzije(p["usable-dimensions"]);
    const dvoosovinska = p["number-of-axles"] === "2";

    // Ključ je `tip`, a ne `vrsta`: `vrsta` je URL parametar kojim katalog bira
    // mašine/prikolice/delove, pa bi faseta istog imena pregazila izbor.
    const facets = jePrikolica
      ? {
          tip: "prikolica",
          program: stavka.grupa,
          ...(p["total-mass"] && { masa: p["total-mass"] }),
          ...(p["number-of-axles"] && {
            osovine: dvoosovinska ? "dvoosovinske" : "jednoosovinske",
          }),
        }
      : { tip: "oprema", program: `oprema-${stavka.grupa}` };

    /* -------------------------------- Podnaslov ------------------------------- */

    const prostor =
      dim.length >= 2 ? `${uMetre(dim[0])} × ${uMetre(dim[1])} m` : null;

    const tagline = jePrikolica
      ? [
          dvoosovinska ? "Dvoosovinska" : "Jednoosovinska",
          p["total-mass"] ? `${p["total-mass"]} kg` : null,
          prostor ? `tovarni prostor ${prostor}` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : OPREMA[stavka.grupa];

    /**
     * Oprema nema `additionalProperty`, nego jednu tehničku rečenicu (marka,
     * nosivost, dimenzije). To je podatak o proizvodu, kao i sam spisak
     * specifikacije, pa se prenosi — za razliku od marketinškog teksta uz
     * prikolice, koji se ne prenosi (opis modela pišemo iz specifikacije).
     */
    const note = jePrikolica ? null : raspakuj(proizvod.description ?? "").trim();

    katalog.push({
      vrsta: stavka.vrsta,
      model: oznaka,
      name: naziv,
      tagline,
      ...(note ? { note } : {}),
      ...(imaSliku ? { image: putanja } : {}),
      facets,
      // Kod opreme `additionalProperty` opisuje PRIKOLICU na koju komad ide
      // (nosivost, broj osovina…), ne sam komad — takva tabela bi zavarala, pa
      // oprema ostaje na svom tehničkom opisu (`note`).
      specs: jePrikolica ? SPECIFIKACIJA(p).filter(Boolean) : [],
      // Samo za uklanjanje duplikata; ne ide u izlazni fajl. Poredi se ADRESA
      // slike na izvoru (lokalno ime se izvodi iz slug-a, pa se kod duplikata
      // uvek razlikuje i ništa ne bi uhvatilo).
      _slika: slike[0]?.split("/").pop() ?? "",
    });

    console.log(`  ${naziv}${imaSliku ? "" : "   (bez fotografije)"}`);
  } catch (err) {
    greske.push(`${stavka.slug}: ${err.message}`);
  }

  // Pauza između zahteva — ne opterećujemo tuđi server.
  await pauza(300);
}

if (katalog.length === 0) {
  console.error("\nNijedan proizvod nije pročitan — katalog nije diran.");
  process.exit(1);
}

/* ------------------------- Duplikati i istoimeni komadi -------------------- */

/** Poređenje bez razmaka i interpunkcije — izvor ih upisuje neujednačeno. */
const kljuc = (t) => (t ?? "").toLowerCase().replace(/[^0-9a-zčćžšđ]+/gi, "");

/**
 * Isti naziv + isti opis + ista fotografija znači da je na izvoru isti komad
 * uveden dvaput (razlikuje ih samo cena, koju ne prenosimo). Ostaje prvi.
 */
const vidjeno = new Set();
const jedinstveni = katalog.filter((k) => {
  const otisak = `${kljuc(k.name)}|${kljuc(k.note)}|${k._slika}`;
  if (vidjeno.has(otisak)) return false;
  vidjeno.add(otisak);
  return true;
});
const izbaceno = katalog.length - jedinstveni.length;

/**
 * Ono što i posle toga deli naziv su stvarno različiti komadi (druga nosivost,
 * perforirane umesto punih stranica…) kojima je izvor dao isto ime. Dobijaju
 * redni broj da se u katalogu razlikuju; razlika se vidi iz opisa.
 */
const brojNaziva = new Map();
for (const k of jedinstveni) {
  brojNaziva.set(kljuc(k.name), (brojNaziva.get(kljuc(k.name)) ?? 0) + 1);
}

const redni = new Map();
let idPrikolica = ID_PRIKOLICE;
let idOprema = ID_OPREMA;

const konacno = jedinstveni.map((k) => {
  const kk = kljuc(k.name);
  let name = k.name;
  if ((brojNaziva.get(kk) ?? 0) > 1) {
    const n = (redni.get(kk) ?? 0) + 1;
    redni.set(kk, n);
    if (n > 1) name = `${k.name} (varijanta ${n})`;
  }
  const { _slika, ...ostatak } = k;
  return {
    id: String(k.vrsta === "prikolica" ? idPrikolica++ : idOprema++),
    ...ostatak,
    name,
  };
});

/* Originali komada koji su ispali iz kataloga — brišu se da folder ne raste. */
const uUpotrebi = new Set(konacno.map((k) => k.image?.split("/").pop()).filter(Boolean));
let obrisano = 0;
for (const fajl of readdirSync(ORIGINALS_DIR)) {
  if (!uUpotrebi.has(fajl)) {
    rmSync(resolve(ORIGINALS_DIR, fajl));
    obrisano++;
  }
}

writeFileSync(OUT_FILE, `${JSON.stringify(konacno, null, 2)}\n`);

const upisanoPrikolica = konacno.filter((k) => k.vrsta === "prikolica").length;
console.log(`\nPrikolica: ${upisanoPrikolica}`);
console.log(`Dodatne opreme: ${konacno.length - upisanoPrikolica}`);
console.log(`Uklonjeno duplikata sa izvora: ${izbaceno} (obrisano slika: ${obrisano})`);
console.log(`Fotografija preuzeto: ${preuzeto}, već postojalo: ${preskoceno}, nema: ${bezSlike}`);
console.log(`Upisano: ${OUT_FILE}`);
console.log(`Originali: ${ORIGINALS_DIR}`);
console.log("\nSLEDEĆI KORAK: `npm run prikolice:slike` — sirove fotografije sa");
console.log("izvora imaju 50 različitih formata i od 25% do 100% praznine u kadru,");
console.log("pa se pre sajta moraju svesti na isti kadar (vidi zaglavlje skripte).");
if (greske.length) {
  console.log(`\nNeuspešno (${greske.length}):`);
  for (const g of greske) console.log(`  ${g}`);
}
