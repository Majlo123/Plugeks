/**
 * Preuzima ORIGINALNE Rolland fotografije proizvoda u najvećoj dostupnoj
 * verziji (599×800) i slaže ih u lokalnu arhivu `data/rolland-originals/`.
 *
 *   node scripts/fetch-rolland-originals.mjs [--limit N] [--ids 25,50] [--only-missing] [--dry]
 *   (ili: npm run originali)
 *
 * ZAŠTO: PlugekS ima dogovor sa Rollandom da koristi njihove originalne
 * fotografije 1:1, sa njihovim žigom. Slike koje su ranije bile na sajtu su
 * bile prekrečene PlugekS logom (dva puta) preko Rollandovog žiga, sa
 * ljubičastim odsjajem — vidno pokvarene. Ova skripta vraća čiste originale.
 *
 * ZAŠTO 599×800: rolland.pl drži pet veličina iste slike, `…-0-1` (112×150) do
 * `…-0-5` (599×800). Ranije se skidala `-0-4` (472×630), a `-0-5` je ista
 * fotografija u većoj rezoluciji — bolja i za karticu i za detaljnu stranu.
 *
 * KAKO SE SASTAVLJA ADRESA: rolland.pl HTML stranice su za skriptu zatvorene
 * (302 → /bot-challenge/ → 403), ali `/uploads/…` putanja nije. Adresa slike je
 *   /uploads/produkt/{GODINA}/{MESEC}/{id}-{osnova}-0-5.jpg
 * gde je:
 *   - `osnova` = slug poljskog naziva proizvoda, odsečen na 42 znaka. Za
 *     proizvode koje smo već skidali osnovu čitamo iz imena lokalnog fajla
 *     (`data/rolland-pages/**`) — to je tačno; za ostale je gradimo iz slug-a u
 *     `data/rolland-sitemap.xml` (poklapa se u ~89% slučajeva; proizvod koji je
 *     posle prvog snimka slike preimenovan nosi staru osnovu i ne može se
 *     pogoditi).
 *   - `{GODINA}/{MESEC}` = mesec kada je slika ubačena. Ne piše nigde, ali
 *     raste monotono sa id-em proizvoda, pa se procenjuje interpolacijom preko
 *     izmerenih tačaka (`data/rolland-ym-anchors.json`, puni se sam u toku
 *     rada) i proverava HEAD zahtevom, uz `lastmod` iz sitemap-a kao rezervu.
 *     U praksi: 1,4 zahteva po proizvodu.
 *
 * Bezbedno je pokretati više puta — već preuzeti id se preskače. Pauza između
 * zahteva i jedan zahtev u trenutku: ne opterećujemo tuđi server.
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES_DIR = resolve(root, "data/rolland-pages");
const SITEMAP = resolve(root, "data/rolland-sitemap.xml");
const OUT_DIR = resolve(root, "data/rolland-originals");
const ANCHORS = resolve(root, "data/rolland-ym-anchors.json");
const REPORT = resolve(root, "data/rolland-originals-report.json");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const BASE = "https://www.rolland.pl/uploads/produkt";

/** Pauza između zahteva (ms) — tuđi server, bez trke. */
const DELAY = 180;

/**
 * Rollandov „photo coming soon" — isti fajl za svaki proizvod bez fotografije,
 * pa se prepoznaje po md5. Skida se, ali se odmah označava: obrada
 * (`scripts/build-product-images.mjs`) ga ne pušta na sajt, jer za takav deo
 * naš brendiran vizual izgleda bolje od tuđe najave.
 *
 * Prepoznavanje po hešu je namerno strogo — nikakva procena po veličini fajla,
 * da nijedna prava fotografija ne bi slučajno ispala.
 */
const PLACEHOLDER_HASHES = new Set([
  "a1c72d51193d505b696702e746bff878", // -0-4 (472×630), 100.186 b
  "514b824e63633bfd4dd58e339cc93f6b", // -0-5 (599×800), 154.783 b
]);

/* --------------------------------- Argumenti ------------------------------- */

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const DRY = flag("--dry");
const ONLY_MISSING = flag("--only-missing");
/**
 * Široka pretraga meseca — svi meseci 2019–2026 umesto okoline procene. Za
 * proizvode kojima je slika ponovo ubačena mnogo posle nego kod suseda po
 * id-u, pa procena po id-u promaši za godinu i više. Skupo, pa se pušta u
 * drugom prolazu, samo nad onima koji su ostali.
 */
const DEEP = flag("--deep");
/**
 * Samo proizvodi za koje već imamo Rollandovu fotografiju snimljenu lokalno i
 * koja NIJE njihova „photo coming soon" najava. Za te je osnova imena fajla
 * tačna, pa se veća verzija (599×800) nalazi iz prvog zahteva.
 *
 * Ovo je normalan režim rada. Bez njega skripta pokušava i proizvode za koje
 * Rolland nema nikakvu sliku (mereno na uzorku od 30: 0 pogodaka) i troši
 * `MAX_ATTEMPTS` zahteva po svakom.
 */
const ONLY_REAL = flag("--only-real");
const LIMIT = Number(opt("--limit") ?? 0) || Infinity;
const ONLY_IDS = opt("--ids")?.split(",").map((s) => s.trim()).filter(Boolean);

/* ---------------------------------- Ulaz ----------------------------------- */

if (!existsSync(SITEMAP)) {
  console.error(`Nema ${SITEMAP}. Bez sitemap-a se adresa slike ne može sastaviti.`);
  process.exit(1);
}

/** id → { slug, lastmod } iz Rollandovog sitemap-a. */
const sitemap = new Map();
for (const m of readFileSync(SITEMAP, "utf8").matchAll(
  /<loc>https?:\/\/[^<]+?\/([^/<]+?),(\d+)\.html<\/loc>(?:\s*<lastmod>([\d-]+)<\/lastmod>)?/g,
)) {
  sitemap.set(m[2], { slug: m[1], lastmod: m[3] });
}

/**
 * id → osnova imena fajla, pročitana iz ranije snimljenih Rolland stranica.
 * Ovo je TAČNA osnova (ime fajla kako ga sajt zaista servira), pa ima prednost
 * nad slug-om iz sitemap-a.
 */
const knownStems = new Map();
/** id-evi kojima je lokalno snimljena slika Rollandova „photo coming soon" najava. */
const localPlaceholders = new Set();
if (existsSync(PAGES_DIR)) {
  for (const e of readdirSync(PAGES_DIR, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const dir = resolve(PAGES_DIR, e.name);
    for (const f of readdirSync(dir)) {
      const m = f.match(/^(\d+)-(.+?)-0-4(?:\(\d+\))?\.jpe?g$/i);
      if (!m) continue;
      if (!knownStems.has(m[1])) knownStems.set(m[1], m[2]);
      const hash = createHash("md5").update(readFileSync(resolve(dir, f))).digest("hex");
      if (PLACEHOLDER_HASHES.has(hash)) localPlaceholders.add(m[1]);
    }
  }
}

/** Svi id-evi iz našeg kataloga — mašine + delovi. */
const machines = JSON.parse(readFileSync(resolve(root, "src/data/machines.json"), "utf8"));
const packed = JSON.parse(readFileSync(resolve(root, "src/data/parts.json"), "utf8"));
const catalogIds = [
  ...machines.map((m) => String(m.id)),
  ...packed.items.map((r) => String(r[0])),
];

const existingMap = (() => {
  const p = resolve(root, "src/data/images.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {};
})();

let targets = catalogIds.filter((id) => sitemap.has(id));
if (ONLY_REAL) {
  targets = targets.filter((id) => knownStems.has(id) && !localPlaceholders.has(id));
}
if (ONLY_MISSING) targets = targets.filter((id) => !existingMap[id]);
if (ONLY_IDS) targets = ONLY_IDS.filter((id) => sitemap.has(id));
// Manji id = starija slika; rastući redosled drži interpolaciju meseca stabilnom.
targets.sort((a, b) => Number(a) - Number(b));

console.log(`Katalog: ${catalogIds.length} proizvoda, u Rolland sitemap-u: ${
  catalogIds.filter((id) => sitemap.has(id)).length
}`);
console.log(
  `Lokalno snimljenih osnova: ${knownStems.size} (od toga „photo coming soon": ${localPlaceholders.size})`,
);
console.log(`Za preuzimanje: ${targets.length}\n`);

/* ------------------------------ Procena meseca ----------------------------- */

/**
 * Izmerene tačke id → "GODINA/MESEC". Čuvaju se između pokretanja: svaki uspeh
 * je nova tačka, pa svako sledeće pokretanje pogađa mesec iz prve.
 */
const anchors = existsSync(ANCHORS)
  ? new Map(Object.entries(JSON.parse(readFileSync(ANCHORS, "utf8"))).map(([k, v]) => [Number(k), v]))
  : new Map();

const ymToIndex = (ym) => {
  const [y, m] = ym.split("/").map(Number);
  return y * 12 + (m - 1);
};
const indexToYm = (i) => `${Math.floor(i / 12)}/${String((i % 12) + 1).padStart(2, "0")}`;

/** Linearna interpolacija meseca po id-u između najbližih izmerenih tačaka. */
function estimateYm(id) {
  if (anchors.size === 0) return null;
  const keys = [...anchors.keys()].sort((a, b) => a - b);
  if (id <= keys[0]) return anchors.get(keys[0]);
  if (id >= keys[keys.length - 1]) return anchors.get(keys[keys.length - 1]);
  let lo = keys[0];
  let hi = keys[keys.length - 1];
  for (const k of keys) {
    if (k <= id) lo = k;
    if (k >= id) { hi = k; break; }
  }
  if (lo === hi) return anchors.get(lo);
  const a = ymToIndex(anchors.get(lo));
  const b = ymToIndex(anchors.get(hi));
  const t = (id - lo) / (hi - lo);
  return indexToYm(Math.round(a + t * (b - a)));
}

/** Prvi i poslednji mesec u kojem rolland.pl ima ijedan `/uploads/produkt/` unos. */
const YM_FLOOR = ymToIndex("2019/01");
const YM_CEIL = ymToIndex("2026/12");

/**
 * Meseci koje vredi probati, po opadajućoj verovatnoći: procena po id-u, pa
 * `lastmod` iz sitemap-a, pa širenje na obe strane od procene. U `--deep`
 * režimu se posle toga dodaju svi ostali meseci, od najnovijeg ka najstarijem
 * (slika koja beži od procene je skoro uvek naknadno zamenjena, dakle novija).
 */
function ymCandidates(id, lastmod) {
  const out = [];
  const seen = new Set();
  const push = (ym) => {
    const i = ymToIndex(ym);
    if (i < YM_FLOOR || i > YM_CEIL) return;
    if (seen.has(ym)) return;
    seen.add(ym);
    out.push(ym);
  };

  const est = estimateYm(Number(id));
  if (est) push(est);
  if (lastmod) push(`${lastmod.slice(0, 4)}/${lastmod.slice(5, 7)}`);

  const center = est
    ? ymToIndex(est)
    : lastmod
      ? ymToIndex(`${lastmod.slice(0, 4)}/${lastmod.slice(5, 7)}`)
      : Math.floor((YM_FLOOR + YM_CEIL) / 2);
  for (let d = 1; d <= 24; d++) {
    push(indexToYm(center + d));
    push(indexToYm(center - d));
  }

  if (DEEP) for (let i = YM_CEIL; i >= YM_FLOOR; i--) push(indexToYm(i));

  return out;
}

/* --------------------------------- Osnove ---------------------------------- */

/**
 * Osnove imena fajla koje vredi probati. Tačna (iz lokalnog fajla) prva; inače
 * slug iz sitemap-a odsečen na 42 znaka — tako sajt i imenuje fajlove — pa još
 * par dužina, jer je pravilo odsecanja izvedeno, ne dokumentovano.
 */
function stemCandidates(id) {
  const out = [];
  const known = knownStems.get(id);
  if (known) out.push(known);
  const slug = sitemap.get(id)?.slug;
  if (slug) {
    for (const n of [42, slug.length]) {
      const s = slug.slice(0, n);
      if (s && !out.includes(s)) out.push(s);
    }
  }
  return out;
}

/* -------------------------------- Preuzimanje ------------------------------ */

let requests = 0;

async function head(url) {
  requests++;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      redirect: "manual",
    });
    const type = res.headers.get("content-type") ?? "";
    return {
      ok: res.status === 200 && type.startsWith("image/"),
      status: res.status,
      len: Number(res.headers.get("content-length") ?? 0),
    };
  } catch (err) {
    return { ok: false, status: "ERR", err: String(err).slice(0, 80) };
  }
}

async function get(url) {
  requests++;
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "manual" });
  const type = res.headers.get("content-type") ?? "";
  if (res.status !== 200 || !type.startsWith("image/")) {
    throw new Error(`HTTP ${res.status} ${type}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Nađe radnu adresu slike za jedan proizvod, ili null.
 *
 * Redosled štedi zahteve na promašajima, kojih ima dve vrste:
 *  - mesec je pogrešan → probamo isti fajl kroz više meseci. Varijanta je zato
 *    NAJSPOLJNIJA petlja: `-0-5` postoji kod skoro svake slike, pa traženje
 *    `-0-4` po svim mesecima pre nego što `-0-5` iscrpi mesece samo dupla cenu.
 *  - osnova imena je pogrešna → nijedan mesec neće raditi. To se ne može
 *    razlikovati od pogrešnog meseca, pa broj pokušaja ide na granicu koja
 *    zavisi od toga da li je osnova pouzdana (pročitana iz imena lokalnog
 *    fajla) ili pogođena iz slug-a.
 */
async function locate(id) {
  const { lastmod } = sitemap.get(id) ?? {};
  const stems = stemCandidates(id);
  const yms = ymCandidates(id, lastmod);
  // Pouzdana osnova → vredi platiti pretragu meseca. Pogođena → kratko.
  const maxAttempts = DEEP ? Infinity : knownStems.has(id) ? 50 : 12;
  let attempts = 0;

  for (const variant of ["0-5", "0-4"]) {
    for (const ym of yms) {
      for (const stem of stems) {
        if (attempts >= maxAttempts) return null;
        attempts++;
        const url = `${BASE}/${ym}/${id}-${stem}-${variant}.jpg`;
        const h = await head(url);
        await sleep(DELAY);
        if (h.ok) return { url, ym, stem, variant, len: h.len };
      }
    }
  }
  return null;
}

mkdirSync(OUT_DIR, { recursive: true });

const report = { fetched: [], placeholder: [], skipped: [], failed: [] };
let done = 0;

for (const id of targets) {
  if (done >= LIMIT) break;

  const target = resolve(OUT_DIR, `${id}.jpg`);
  if (existsSync(target)) {
    report.skipped.push(id);
    // Već preuzeto — ali mesec i dalje vredi kao tačka za interpolaciju.
    continue;
  }

  done++;
  const found = await locate(id);
  if (!found) {
    report.failed.push({ id, slug: sitemap.get(id)?.slug, stems: stemCandidates(id) });
    process.stdout.write(`\n  ${id} → nema (probano ${stemCandidates(id).length} osnova)`);
    continue;
  }

  // Uspeh je i nova tačka za procenu meseca sledećih proizvoda.
  anchors.set(Number(id), found.ym);

  if (DRY) {
    report.fetched.push({ id, ...found });
    process.stdout.write(`\n  ${id} → ${found.url.replace(BASE, "…")} (${found.len}b)`);
    continue;
  }

  try {
    const buf = await get(found.url);
    await sleep(DELAY);
    const hash = createHash("md5").update(buf).digest("hex");

    if (PLACEHOLDER_HASHES.has(hash)) {
      // „photo coming soon" — nije fotografija. Ne snima se: katalog za takav
      // deo prikazuje naš brendiran vizual, što izgleda bolje od tuđe najave.
      report.placeholder.push({ id, url: found.url });
      process.stdout.write(`\n  ${id} → photo coming soon (preskočeno)`);
      continue;
    }

    writeFileSync(target, buf);
    report.fetched.push({ id, url: found.url, ym: found.ym, variant: found.variant, bytes: buf.length });
  } catch (err) {
    report.failed.push({ id, url: found.url, error: String(err).slice(0, 100) });
    process.stdout.write(`\n  ${id} → ${String(err).slice(0, 60)}`);
  }

  if (report.fetched.length % 25 === 0 && report.fetched.length > 0) {
    process.stdout.write(
      `\n  …${report.fetched.length} preuzeto, ${report.failed.length} bez slike, ${requests} zahteva`,
    );
    writeFileSync(ANCHORS, `${JSON.stringify(Object.fromEntries(anchors), null, 1)}\n`);
  }
}

if (!DRY) {
  writeFileSync(ANCHORS, `${JSON.stringify(Object.fromEntries(anchors), null, 1)}\n`);
  writeFileSync(REPORT, `${JSON.stringify(report, null, 1)}\n`);
}

console.log(`\n
Preuzeto:            ${report.fetched.length}
Već postojalo:       ${report.skipped.length}
„photo coming soon": ${report.placeholder.length}
Bez slike:           ${report.failed.length}
HTTP zahteva:        ${requests}${
  report.fetched.length ? `\nZahteva po slici:    ${(requests / report.fetched.length).toFixed(2)}` : ""
}`);
if (report.failed.length) {
  console.log(`\nBez slike (prvih 10):`);
  for (const f of report.failed.slice(0, 10)) console.log(`  ${f.id}  ${f.slug ?? ""}`);
}
