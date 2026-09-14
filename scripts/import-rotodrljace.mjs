/**
 * Uvozi delove za ROTO DRLJAČE sa psc-ferencak.hr u naš katalog delova.
 *
 *   node scripts/import-rotodrljace.mjs [--dry]     (ili: npm run rotodrljace)
 *
 * Posle toga, redom:
 *   npm run slike:kadar -- rotodrljace   → slike za sajt (i skidanje žiga)
 *   npm run catalog                      → spajanje sa Rolland delovima u parts.json
 *
 * IZVOR: kategorija „Rotodrljače" (https://www.psc-ferencak.hr/rotodrljace/5/)
 * nosi sve što se za roto drljaču troši — noževe, klinove, čistače valjka,
 * ležajeve, kućišta i osovinice — sa jasnim tehničkim crtežima (dimenzije na
 * samoj slici) i markom mašine u naslovu. Spisak se čita iz mreže proizvoda te
 * kategorije; strana prima `?s=` (koliko po strani), pa ceo spisak stane u jedan
 * zahtev, a za svaki slučaj se prolaze i ostale strane dok ima novih.
 *
 * ŠTA RADI:
 *  1. sa mreže čita naziv, njihov id i šifru, potkategoriju i putanju slike
 *  2. naziv (velika slova, hrvatski, skraćenice) prevodi u naš oblik:
 *     „NOŽ ROTO DRLJAČE LEMKEN D. 320x110x72x15 fi17" →
 *     „Nož roto drljače Lemken 320x110x72x15 fi 17 (desno)"
 *  3. iz naziva vadi TIP (za filter), MARKU mašine i STRANU ugradnje
 *  4. skida veliku sliku u `data/ferencak-originals/{naš id}.webp`
 *  5. upisuje `src/data/rotodrljace.json` (redovi u istom obliku koji pravi
 *     build-catalog.mjs za Rolland delove) i `src/data/images.json`
 *
 * KATALOŠKI BROJEVI su naši, od 6001 naviše (Rolland staje na 4790, Hofman
 * mašine su 5001–5999, prikolice od 9001). Broj se veže za NJIHOV id proizvoda
 * i čuva u `rotodrljace.json`, pa ponovno pokretanje ne pomera postojeće —
 * novi komad dobija sledeći slobodan broj, a nestali se briše.
 *
 * ŠTA NAMERNO NE PRENOSI: cene (PlugekS radi po upitu; njihov iznos u evrima
 * ostaje samo kao podatak `izvor.cena` u JSON-u, nigde na sajtu) i opis —
 * izvor ga i nema, naziv je ceo opis.
 *
 * ŽIG: na nekoliko crteža izvor ima poluprovidan logo preko sredine. Skida ga
 * `scripts/normalize_product_images.py` (posao `rotodrljace`), ne ova skripta.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGINALS_DIR = resolve(root, "data/ferencak-originals");
const OUT_FILE = resolve(root, "src/data/rotodrljace.json");
const IMAGES_FILE = resolve(root, "src/data/images.json");
const WEB_DIR = "/images/rotodrljace";

const ORIGIN = "https://www.psc-ferencak.hr";
const KATEGORIJA = "/rotodrljace/5/";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const DRY = process.argv.includes("--dry");

/** Prvi naš kataloški broj za ovu grupu. */
const ID_OD = 6001;

/** Pauza između zahteva — mali sajt, ne gura se. */
const PAUZA_MS = 300;
const spavaj = (ms) => new Promise((r) => setTimeout(r, ms));

/* --------------------------------- Naša podela ---------------------------- */

const GRUPA = { key: "delovi-roto-drljace", label: "Delovi za roto drljače" };

/**
 * Tip dela po početku naziva. Naziv tipa je i početak našeg naziva proizvoda —
 * tip u filteru i naziv na kartici se time poklapaju slovo u slovo.
 * `skini` je deo naslova koji tip „pojede"; ostatak su marka, mere i strana.
 */
const TIPOVI = [
  { uzorak: /^NOŽ ROTO DRLJ(?:AČE|\.)\s*/i, key: "noz-roto-drljace", label: "Nož roto drljače" },
  { uzorak: /^KLIN ROTO DRLJAČE\s*/i, key: "klin-roto-drljace", label: "Klin roto drljače" },
  { uzorak: /^ČISTAČ VALJKA\s*/i, key: "cistac-valjka", label: "Čistač valjka roto drljače" },
  // Izvor piše i „KUČIŠTE" (Č umesto Ć) — prihvata se oboje.
  { uzorak: /^KU[ĆČ]IŠTE LEŽAJA(?: RD)?\s*/i, key: "kuciste-lezaja", label: "Kućište ležaja roto drljače" },
  { uzorak: /^LEŽAJ\s+(.*?)\s*ROTO DRLJAČE\s*/i, key: "lezaj-roto-drljace", label: "Ležaj roto drljače" },
  { uzorak: /^ZAŠTITA NOŽA(?: RD)?\s*/i, key: "zastita-noza", label: "Zaštita noža roto drljače" },
  { uzorak: /^BOLCNA\s*/i, key: "osovinica", label: "Osovinica roto drljače" },
];

/**
 * Marke mašina. Ključ i naziv za FILTER su isti kao u Rolland rečniku kad ista
 * marka već postoji (Lemken, Kuhn, Kverneland, Maschio…) — jedna marka, jedan
 * unos u filteru bez obzira iz kog izvora deo dolazi. `ime` je kako se marka
 * piše u nazivu proizvoda: „Kuhn", a ne „Kuhn / Huard" (Huard su plugovi).
 */
const MARKE = {
  AMAZONE: { key: "amazone", label: "Amazone" },
  ALPEGO: { key: "alpego", label: "Alpego" },
  ARTERA: { key: "artera", label: "Artera" },
  BEFA: { key: "befa", label: "Befa" },
  BREVIGLIERI: { key: "breviglieri", label: "Breviglieri" },
  CARRARO: { key: "carraro", label: "Carraro" },
  CELLI: { key: "celli", label: "Celli" },
  EBERHARDT: { key: "eberhardt", label: "Eberhardt" },
  EUROMA: { key: "euroma", label: "Euroma" },
  FERABOLI: { key: "feraboli", label: "Feraboli" },
  FORIGO: { key: "forigo", label: "Forigo" },
  FRANDENT: { key: "frandent", label: "Frandent" },
  HOWARD: { key: "howard", label: "Howard" },
  KRONE: { key: "krone", label: "Krone" },
  KUHN: { key: "kuhn-huard", label: "Kuhn / Huard", ime: "Kuhn" },
  KVERNELAND: { key: "kverneland", label: "Kverneland" },
  "KVERN.": { key: "kverneland", label: "Kverneland" },
  "KVER.": { key: "kverneland", label: "Kverneland" },
  LANDSBERG: { key: "landsberg-pottinger", label: "Landsberg / Pöttinger", ime: "Landsberg" },
  LELY: { key: "lely", label: "Lely" },
  LELLY: { key: "lely", label: "Lely" },
  LEMKEN: { key: "lemken", label: "Lemken" },
  MALETTI: { key: "maletti", label: "Maletti" },
  MASCHIO: { key: "maschio", label: "Maschio" },
  "MASCH.": { key: "maschio", label: "Maschio" },
  MASHIO: { key: "maschio", label: "Maschio" },
  MORRA: { key: "morra", label: "Morra" },
  NIEMEYER: { key: "niemeyer", label: "Niemeyer" },
  PEGORARO: { key: "pegoraro", label: "Pegoraro" },
  PERUGINI: { key: "perugini", label: "Perugini" },
  "PERUG.": { key: "perugini", label: "Perugini" },
  POTTINGER: { key: "landsberg-pottinger", label: "Landsberg / Pöttinger", ime: "Pöttinger" },
  RABE: { key: "rabe-werk", label: "Rabewerk", ime: "Rabe" },
  RAU: { key: "rau", label: "Rau" },
  REMAC: { key: "remac", label: "Remac" },
  "ROTOITAL.": { key: "rotoitalia", label: "Rotoitalia" },
  SEIMA: { key: "seima", label: "Seima" },
  SICMA: { key: "sicma", label: "Sicma" },
  SLAM: { key: "slam", label: "Slam" },
  VICON: { key: "vicon", label: "Vicon" },
  VIGOLO: { key: "vigolo", label: "Vigolo" },
};

/** Oznaka strane ugradnje u naslovu → naš ključ. */
const STRANE = {
  "D.": "desni",
  D: "desni",
  DESNI: "desni",
  "L.": "levi",
  L: "levi",
  LIJEVI: "levi",
};
const SUFIKS_STRANE = { levi: "levo", desni: "desno" };

/**
 * Reči iz naslova koje NISU mere — prevode se i ostaju u nazivu. Sve ostalo
 * (brojevi, navoji, oznake serija) prolazi netaknuto, samo se ujednači zapis.
 */
const RECI = {
  "ORIG.": "original",
  ORIGINAL: "original",
  ORGINAL: "original",
  "ZAMJ.": "zamenski",
  POVINUTI: "savijeni",
  RAVNI: "ravni",
  OJAČANI: "ojačani",
  "PAČJA": "pačja",
  NOGA: "noga",
  BRZO: "brzo",
  MJENJAJUČI: "izmenjivi",
  MJENJAJUĆI: "izmenjivi",
  PVC: "PVC",
  ZVIJEZDA: "zvezda",
  QUICKFIT: "Quickfit",
  CULTIMIX: "Cultimix",
};

/* --------------------------------- Prevod --------------------------------- */

/** „&#x2B;" → „+", višak razmaka, tipografske sitnice. */
const ocisti = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Jedan token mera: „fi17" / „FI 18" / „fi 17mm" → „fi 17"; „60X10" → „60x10";
 * „mm" na kraju otpada (svi crteži su u milimetrima).
 */
function mera(token) {
  let t = token.replace(/mm$/i, "").replace(/\/+$/, "");
  const fi = t.match(/^fi\s*(\d.*)$/i);
  if (fi) return `fi ${fi[1]}`;
  // „60X10/13/44" — samo veliko X između cifara postaje malo x; navoj je
  // uvek veliko M („m20x1.5" → „M20x1.5").
  t = t.replace(/(\d)X(\d)/g, "$1x$2").replace(/m(\d+)x/g, "M$1x");
  return t;
}

/**
 * Razlaže sirov naslov u tip, marke, stranu i ostatak. Vraća `null` kad tip
 * nije prepoznat — takav komad se ne uvozi, nego se prijavi na kraju.
 */
function prevedi(sirovo) {
  const naslov = ocisti(sirovo);
  const tip = TIPOVI.find((t) => t.uzorak.test(naslov));
  if (!tip) return null;

  const m = naslov.match(tip.uzorak);
  // Kod ležaja oznaka stoji IZMEĐU „LEŽAJ" i „ROTO DRLJAČE" („LEŽAJ 30210 A ROTO
  // DRLJAČE BREVIGLIERI"), pa je uzorak hvata kao grupu i vraća je u ostatak.
  const uhvaceno = m[1] ? `${m[1]} ` : "";
  let ostatak = uhvaceno + naslov.slice(m[0].length);

  // „fi 17" / „FI 18" su dva tokena — spoji ih pre tokenizacije.
  ostatak = ostatak.replace(/\bfi\s+(\d)/gi, "fi$1");

  const marke = [];
  let strana = null;
  const reci = [];

  const dodajMarku = (token) => {
    const m2 = MARKE[token.toUpperCase()];
    if (m2 && !marke.includes(m2)) marke.push(m2);
    return Boolean(m2);
  };

  for (let token of ostatak.split(" ").filter(Boolean)) {
    // Zapeta iza marke u nabrajanju („POTTINGER, SICMA, MALETTI, BEFA")
    token = token.replace(/,$/, "");
    if (!token) continue;

    // Marka, strana i mere u jednom tokenu: „KVERN.D.320/100/15".
    const troje = token.match(/^([A-ZČĆŠĐŽ]+\.?)([DL])\.(\d\S*)$/i);
    if (troje && MARKE[troje[1].toUpperCase()] && !strana) {
      dodajMarku(troje[1]);
      strana = STRANE[`${troje[2].toUpperCase()}.`];
      reci.push(mera(troje[3]));
      continue;
    }

    // Strana zalepljena za mere: „D.305/110/68" → „D." + „305/110/68".
    const zalepljena = token.match(/^([DL])\.(\S+)$/i);
    if (zalepljena && !strana && /\d/.test(zalepljena[2])) {
      strana = STRANE[`${zalepljena[1].toUpperCase()}.`];
      token = zalepljena[2];
    }

    // „PEGORARO,RAU", „SICMA/LANDSBERG", „KUHN/KVER.", „FERABOLI-VICON"
    const delovi = token.split(/[,/]|(?<=[A-ZČĆŠĐŽ])-(?=[A-ZČĆŠĐŽ])/i).filter(Boolean);
    if (delovi.length > 1 && delovi.every((d) => MARKE[d.toUpperCase()])) {
      delovi.forEach(dodajMarku);
      continue;
    }

    // Marka zalepljena za mere: „AMAZONE115x55x3".
    const zalepljenaMarka = token.match(/^([A-ZČĆŠĐŽ]+)(\d.*)$/i);
    if (zalepljenaMarka && MARKE[zalepljenaMarka[1].toUpperCase()]) {
      dodajMarku(zalepljenaMarka[1]);
      reci.push(mera(zalepljenaMarka[2]));
      continue;
    }

    if (dodajMarku(token)) continue;

    if (STRANE[token.toUpperCase()] && !strana && !/\d/.test(token)) {
      strana = STRANE[token.toUpperCase()];
      continue;
    }

    if (RECI[token.toUpperCase()]) {
      reci.push(RECI[token.toUpperCase()]);
      continue;
    }

    reci.push(mera(token));
  }

  const imeMarke = (mk) => mk.ime ?? mk.label;
  const name = [tip.label, marke.map(imeMarke).join(" / "), reci.join(" ")]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    name: strana ? `${name} (${SUFIKS_STRANE[strana]})` : name,
    partType: tip.key,
    partTypeLabel: tip.label,
    brand: marke[0]?.key ?? "univerzalno",
    brandLabel: marke[0]?.label ?? "Univerzalno / bez oznake",
    side: strana,
  };
}

/* -------------------------------- Preuzimanje ----------------------------- */

async function html(putanja) {
  const res = await fetch(`${ORIGIN}${putanja}`, {
    headers: { "User-Agent": UA, "Accept-Language": "hr,sr;q=0.9" },
  });
  if (!res.ok) throw new Error(`${putanja} → HTTP ${res.status}`);
  return res.text();
}

/** Jedan red mreže proizvoda → sirovi podaci. */
function izMreze(stranica) {
  const blokovi = stranica.match(
    /<div class="col-lg-4 col-6 col-sm-6 product-item-box[\s\S]*?<h2 class="title">/g,
  );
  if (!blokovi) return [];
  return blokovi.flatMap((b) => {
    const polje = (k) => b.match(new RegExp(`data-product_${k}="([^"]*)"`))?.[1] ?? "";
    const slika = b.match(/<img[^>]*class="[^"]*productEntityClick[^"]*"[^>]*src="([^"]*)"/)?.[1];
    const href = b.match(/<a href="(\/[^"]*\/product\/)"/)?.[1];
    if (!polje("id")) return [];
    return [
      {
        id: polje("id"),
        sifra: polje("sifra"),
        naziv: ocisti(polje("name")),
        potkategorija: ocisti(polje("category2")),
        cena: Number(polje("price")) || null,
        url: href ? `${ORIGIN}${href}` : null,
        slika: slika?.startsWith("/") ? `${ORIGIN}${slika}` : slika,
      },
    ];
  });
}

/** Ceo spisak kategorije, kroz sve strane. */
async function spisak() {
  const svi = new Map();
  for (let strana = 1; strana < 40; strana++) {
    const redovi = izMreze(await html(`${KATEGORIJA}?p=${strana}&s=200`));
    const novih = redovi.filter((r) => !svi.has(r.id));
    for (const r of novih) svi.set(r.id, r);
    process.stdout.write(`\r  strana ${strana}: ${svi.size} proizvoda   `);
    if (novih.length === 0) break;
    await spavaj(PAUZA_MS);
  }
  console.log();
  return [...svi.values()];
}

async function skiniSliku(url, cilj) {
  if (existsSync(cilj)) return "već";
  await spavaj(PAUZA_MS);
  const res = await fetch(url, { headers: { "User-Agent": UA, Referer: ORIGIN } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 512) throw new Error(`prazna slika (${buf.length} B)`);
  writeFileSync(cilj, buf);
  return "ok";
}

/* ----------------------------------- Main --------------------------------- */

console.log("Spisak sa psc-ferencak.hr …");
const sirovi = await spisak();

// Stabilni kataloški brojevi: postojeći se čuvaju po njihovom id-u.
const postojeci = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : [];
const brojPoIzvoru = new Map(postojeci.map((r) => [String(r.izvor?.id), r.id]));
let sledeci = Math.max(ID_OD - 1, ...postojeci.map((r) => Number(r.id))) + 1;

const redovi = [];
const neprepoznati = [];
const bezMarke = [];

// Prvi uvoz numeriše po potkategoriji pa nazivu — da se srodni komadi nađu
// jedan do drugog u kataloškom indeksu.
const poRedu = [...sirovi].sort(
  (a, b) => a.potkategorija.localeCompare(b.potkategorija, "hr") || a.naziv.localeCompare(b.naziv, "hr"),
);

for (const s of poRedu) {
  const prevod = prevedi(s.naziv);
  if (!prevod) {
    neprepoznati.push(s.naziv);
    continue;
  }
  if (prevod.brand === "univerzalno") bezMarke.push(s.naziv);

  const id = brojPoIzvoru.get(String(s.id)) ?? String(sledeci++);
  redovi.push({
    id,
    ...prevod,
    group: GRUPA.key,
    groupLabel: GRUPA.label,
    izvor: { id: s.id, sifra: s.sifra, url: s.url, cena: s.cena, naziv: s.naziv, slika: s.slika },
  });
}

// Isti naziv za dva komada (npr. dva „Nož roto drljače Kuhn (desno)" bez mera)
// — drugi dobija sufiks, inače ga deduplikacija u build-catalog.mjs proguta.
const videno = new Map();
for (const r of redovi) {
  const n = (videno.get(r.name) ?? 0) + 1;
  videno.set(r.name, n);
  if (n > 1) {
    const strana = r.name.match(/\s\((levo|desno)\)$/);
    r.name = strana
      ? `${r.name.slice(0, -strana[0].length)} (varijanta ${n}) ${strana[0].trim()}`
      : `${r.name} (varijanta ${n})`;
  }
}

/* --- Slike --- */

const imageMap = existsSync(IMAGES_FILE) ? JSON.parse(readFileSync(IMAGES_FILE, "utf8")) : {};
if (!DRY) mkdirSync(ORIGINALS_DIR, { recursive: true });

let skinuto = 0;
const neuspele = [];
for (const r of redovi) {
  if (!r.izvor.slika) continue;
  // Velika slika ima istu putanju kao mala, samo u drugom folderu.
  const velika = r.izvor.slika.replace("/slike/male/", "/slike/velike/");
  const cilj = resolve(ORIGINALS_DIR, `${r.id}.webp`);
  if (DRY) {
    imageMap[r.id] = `${WEB_DIR}/${r.id}.jpg`;
    continue;
  }
  try {
    if ((await skiniSliku(velika, cilj)) === "ok") skinuto++;
    imageMap[r.id] = `${WEB_DIR}/${r.id}.jpg`;
  } catch (e) {
    neuspele.push(`${r.id} ← ${velika} (${e.message})`);
  }
  process.stdout.write(`\r  slike: ${skinuto} novih   `);
}
console.log();

/* --- Upis --- */

if (!DRY) {
  // Delovi kojih više nema na izvoru ispadaju i iz mape slika.
  const aktivni = new Set(redovi.map((r) => r.id));
  for (const id of Object.keys(imageMap)) {
    if (imageMap[id].startsWith(`${WEB_DIR}/`) && !aktivni.has(id)) delete imageMap[id];
  }
  writeFileSync(OUT_FILE, `${JSON.stringify(redovi, null, 2)}\n`);
  writeFileSync(IMAGES_FILE, `${JSON.stringify(imageMap, null, 2)}\n`);
}

/* --- Izveštaj --- */

const poTipu = new Map();
const poMarki = new Map();
for (const r of redovi) {
  poTipu.set(r.partTypeLabel, (poTipu.get(r.partTypeLabel) ?? 0) + 1);
  poMarki.set(r.brandLabel, (poMarki.get(r.brandLabel) ?? 0) + 1);
}
console.log(`\nUvezeno: ${redovi.length} delova (${DRY ? "dry — ništa nije upisano" : OUT_FILE})`);
for (const [t, n] of [...poTipu].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${t}`);
console.log(`Marke: ${[...poMarki].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m} (${n})`).join(", ")}`);
if (bezMarke.length) console.log(`\nBez prepoznate marke (${bezMarke.length}):\n  ${bezMarke.join("\n  ")}`);
if (neprepoznati.length) console.log(`\nNEPREPOZNAT TIP — dopuni TIPOVI (${neprepoznati.length}):\n  ${neprepoznati.join("\n  ")}`);
if (neuspele.length) console.log(`\nSlike koje nisu skinute (${neuspele.length}):\n  ${neuspele.join("\n  ")}`);
console.log(`\nSledeći korak: npm run slike:kadar -- rotodrljace, pa npm run catalog`);
