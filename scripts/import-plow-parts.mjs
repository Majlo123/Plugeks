/**
 * Uvozi fotografije delova za PLUGOVE sa agritechnicom.co.rs i mapira ih na naš
 * katalog + gradi listu najtraženijih delova za početnu stranu.
 *
 *   node scripts/import-plow-parts.mjs [--dry] [--report]
 *   (ili: npm run plugovi)
 *
 * ZAŠTO OVAJ IZVOR: agritechnicom.co.rs prikazuje Molbro program potrošnih
 * delova za plugove (Kverneland, Lemken, Kuhn, Överum, Vogel & Noot, Regent,
 * Rabe, Pöttinger) sa čistim tehničkim crtežima i OEM kataloškim brojem u
 * naslovu. Naši nazivi iz Rolland kataloga nose ISTE brojeve, samo drugačije
 * formatirane („344 4012" ↔ „3444012"), pa se slika i proizvod povezuju
 * automatski — bez ručnog rada.
 *
 * ŠTA RADI:
 *   1. skida stranice Molbro programa (robots.txt ih dozvoljava),
 *   2. iz Elementor „image-box" widgeta čita naslov + adresu slike,
 *   3. poklapa kataloški broj sa delovima ISTOG brenda u `src/data/parts.json`,
 *   4. slike snima u `public/images/plugovi/{id}.jpg` i upisuje ih u
 *      `src/data/images.json` (gazi staru sliku tog dela — nove su bolje),
 *   5. upisuje `src/data/popular.json` — najtraženiji delovi za plugove, u
 *      malom fajlu koji se smije uvesti i u klijentski bundle (početna strana i
 *      katalog pre filtriranja).
 *
 * Bezbedno je pokretati više puta; `--dry` ništa ne upisuje, `--report` ispisuje
 * i sve nepovezane naslove (korisno kad se njihov spisak promeni).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IMAGES_DIR = resolve(root, "public/images/plugovi");
const MAP_FILE = resolve(root, "src/data/images.json");
const POPULAR_FILE = resolve(root, "src/data/popular.json");
const WEB_DIR = "/images/plugovi";

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const REPORT = argv.includes("--report");

const BASE = "https://www.agritechnicom.co.rs";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * Njihova stranica po brendu → naš `brands[].key` iz parts.json.
 * Redosled je i redosled prikaza (kao u njihovom meniju); Horsch nema para u
 * našem katalogu (grubersi, ne plugovi) pa se preskače.
 */
const BRAND_PAGES = [
  ["kverneland", "kverneland"],
  ["lemken", "lemken"],
  ["kuhn", "kuhn-huard"],
  ["overum", "overum"],
  ["vogel-noot", "vogel-noot"],
  ["regent", "regent"],
  ["rabe", "rabe-werk"],
  ["pottinger", "landsberg-pottinger"],
];

/* -------------------------------------------------------------------------- */
/*                              Njihove stranice                              */
/* -------------------------------------------------------------------------- */

const IMAGE_BOX = /<div class="elementor-image-box-wrapper">([\s\S]*?)<\/div>\s*<\/div>/g;

const unescapeHtml = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();

/** Skida jednu stranicu brenda i vraća [{ title, image }] u redosledu prikaza. */
async function fetchBoxes(slug) {
  const url = `${BASE}/rezervni-delovi/molbro-rezervni-delovi-za-plugove-i-grubere/${slug}/`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const html = await res.text();

  const out = [];
  for (const [, chunk] of html.matchAll(IMAGE_BOX)) {
    const image = chunk.match(/<img[^>]+src="([^"]+)"/)?.[1];
    const title = chunk.match(
      /elementor-image-box-title[^>]*>(?:<a[^>]*>)?([\s\S]*?)(?:<\/a>)?<\/h[0-9]>/,
    )?.[1];
    if (image && title) out.push({ title: unescapeHtml(title), image });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*                                 Naš katalog                                */
/* -------------------------------------------------------------------------- */

const packed = JSON.parse(readFileSync(resolve(root, "src/data/parts.json"), "utf8"));

/** „Plužna daska Överum 96 084 (levo)" → „PLUZNADASKAOVERUM96084LEVO". */
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/ł/gi, "l")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

/**
 * Svi kataloški brojevi koje naziv može da nosi: Rolland ih piše u grupama
 * („344 4012", „073 284"), pa se uzimaju sve spojeve susednih grupa cifara.
 * Time „622 136 622 212" daje i 622136 i 622212, ali ne i 6221366 — pola broja
 * se nikad ne poklapa slučajno.
 */
function catalogNumbers(name) {
  const out = new Set();
  for (const run of name.match(/\d[\d ]*\d|\d/g) ?? []) {
    const groups = run.split(/\s+/).filter(Boolean);
    for (let i = 0; i < groups.length; i++) {
      let joined = "";
      for (let j = i; j < groups.length; j++) {
        joined += groups[j];
        if (joined.length >= 4) out.add(joined);
      }
    }
  }
  return out;
}

const at = (table, i) => (i >= 0 ? table[i] : undefined);

const items = packed.items.map(([id, name, g, t, b, s]) => ({
  id,
  name,
  group: at(packed.groups, g),
  type: at(packed.types, t),
  brand: at(packed.brands, b),
  side: at(packed.sides, s),
  key: norm(name),
  numbers: catalogNumbers(name),
  facets: {
    ...(g >= 0 && { grupa: packed.groups[g].key }),
    ...(t >= 0 && { tip: packed.types[t].key }),
    ...(b >= 0 && { brend: packed.brands[b].key }),
    ...(s >= 0 && { strana: packed.sides[s].key }),
  },
}));

const byBrand = new Map();
for (const item of items) {
  if (!item.brand) continue;
  if (!byBrand.has(item.brand.key)) byBrand.set(item.brand.key, []);
  byBrand.get(item.brand.key).push(item);
}

/* -------------------------------------------------------------------------- */
/*                                 Poklapanje                                 */
/* -------------------------------------------------------------------------- */

/**
 * Kataloški broj iz njihovog naslova, u svim viđenim zapisima.
 * „Raonik 3352234C" → 3352234C, 3352234 (navaren karbidom je isti deo)
 * „Raonik DW 440 L"  → DW440L, DW440   (prefiks brenda je levo od broja)
 * „Daska 80604/85261" → 80604, 85261   (dva broja za isti deo)
 * „Daska 63261"      → 63261, 063261   (oni izostavljaju vodeću nulu)
 */
function titleCodes(title) {
  const tokens = title.split(/\s+/).filter(Boolean);
  const first = tokens.findIndex((t) => /\d/.test(t));
  if (first < 0) return [];

  // Kratka velika oznaka pre broja pripada broju („PK 401301", „DW 440 L").
  let start = first;
  while (start > 0 && /^[A-ZČĆŠĐŽ]{1,3}$/.test(tokens[start - 1])) start--;

  const codes = new Set();
  const add = (raw) => {
    const c = norm(raw);
    if (c.length < 4) return;
    codes.add(c);
    // „3352234C" / „3374425C" — sufiks za navareni karbid, isti kataloški broj.
    if (/\dC$/.test(c)) codes.add(c.slice(0, -1));
    // Oni pišu 5-cifrene brojeve bez vodeće nule (Kverneland 63261 = 063 261).
    if (/^\d{5}$/.test(c)) codes.add(`0${c}`);
  };

  add(tokens.slice(start).join(""));

  for (const token of tokens.slice(start)) {
    if (!/\d/.test(token)) continue;
    // „73/63-300" → serije 73 i 63 istog dela; „311069-2" → i osnovni broj.
    const [head, tail] = token.split("-");
    for (const piece of head.split("/")) add(piece + (tail ?? ""));
    if (tail) for (const piece of head.split("/")) add(piece);
    // „73/63-300" → 73300 i 63300 (druga grana: prefiks + zajednički nastavak).
    const split = token.match(/^(\d+)\/(\d+)-(\d+)$/);
    if (split) {
      add(split[1] + split[3]);
      add(split[2] + split[3]);
    }
  }
  return [...codes];
}

/** Naša strana ugradnje (`sides[].key`) koju njihov sufiks L/R podrazumeva. */
function codeSide(code) {
  if (/[0-9A-Z]{3,}L$/.test(code)) return "levi";
  if (/[0-9A-Z]{3,}R$/.test(code)) return "desni";
  return null;
}

/**
 * Zadnja linija za oznake tipa „HRP296O" / „DW440L": isti delovi, ali Rolland
 * piše iste komade drugim redom („HRP O 296", „DW S 720"). Zato se oznaka
 * razlaže na slovne i brojne delove i traži se naziv koji sadrži SVE njih.
 *
 * Samo za oznake sa slovima — čist broj se poklapa tačno (`numbers`), pa bi
 * traženje po delu broja tu davalo pogrešne pogotke.
 */
function chunkMatch(pool, code) {
  const chunks = code.match(/[A-Z]+|\d+/g) ?? [];
  if (!chunks.some((c) => /^\d{3,}$/.test(c))) return [];
  // Jedno slovo ne znači ništa („A", ili strana ugradnje) — ne traži se.
  const required = chunks.filter((c) => c.length >= 2);
  return pool.filter((it) => required.every((c) => it.key.includes(c)));
}

/**
 * Delovi našeg kataloga koji odgovaraju jednom njihovom naslovu.
 * Prvo po tačnom kataloškom broju, pa po alfanumeričkoj oznaci (PK401301), pa
 * po razloženoj oznaci — uvek samo unutar istog brenda, pa lažnih poklapanja
 * praktično nema.
 */
function matchItem(title, brandKey) {
  const pool = byBrand.get(brandKey) ?? [];
  for (const code of titleCodes(title)) {
    const digits = /^\d+$/.test(code);
    let hits = pool.filter((it) =>
      digits ? it.numbers.has(code) : it.key.includes(code),
    );
    if (!hits.length && !digits) hits = chunkMatch(pool, code);
    // „SSP294OSL" — poslednje slovo je strana ugradnje, ne deo oznake.
    if (!hits.length && /[A-Z][LR]$/.test(code)) hits = chunkMatch(pool, code.slice(0, -1));
    if (!hits.length) continue;

    // „…OSL" / „…SR" — sufiks nosi stranu ugradnje; suzi ako oba postoje.
    const side = codeSide(code);
    if (side && hits.length > 1) {
      const sided = hits.filter((it) => it.side?.key === side);
      if (sided.length) hits = sided;
    }
    // Više od 4 pogotka = broj je previše generičan; radije ništa nego pogrešno.
    if (hits.length > 4) continue;
    return { hits, code };
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*                                  Preuzimanje                               */
/* -------------------------------------------------------------------------- */

async function download(url, target) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error(`prazna slika (${buf.length} B)`);
  writeFileSync(target, buf);
  return buf.length;
}

/* -------------------------------------------------------------------------- */
/*                                    Glavni                                  */
/* -------------------------------------------------------------------------- */

const imageMap = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, "utf8")) : {};
if (!DRY) mkdirSync(IMAGES_DIR, { recursive: true });

/** id → { ...deo, image } za sve povezane delove, u redosledu njihovog sajta. */
const matched = new Map();
const unmatched = [];
let boxes = 0;

for (const [page, brandKey] of BRAND_PAGES) {
  const found = await fetchBoxes(page);
  boxes += found.length;
  let hits = 0;

  for (const box of found) {
    const match = matchItem(box.title, brandKey);
    if (!match) {
      unmatched.push(`${page}: ${box.title}`);
      continue;
    }
    hits++;
    for (const item of match.hits) {
      // Prvi naslov koji pokrije deo pobeđuje (njihov redosled = njihov prioritet).
      if (!matched.has(item.id)) matched.set(item.id, { item, box, page });
    }
  }
  console.log(
    `${page.padEnd(12)} ${String(found.length).padStart(3)} sa sajta → ${String(hits).padStart(3)} povezano`,
  );
}

/* --- Slike --- */

let downloaded = 0;
let skipped = 0;
const failed = [];
for (const [id, { box }] of matched) {
  const ext = (box.image.match(/\.(jpe?g|png|webp)(?:\?|$)/i)?.[1] ?? "jpg").toLowerCase();
  const file = resolve(IMAGES_DIR, `${id}.${ext}`);
  const web = `${WEB_DIR}/${id}.${ext}`;
  if (DRY) {
    imageMap[id] = web;
    continue;
  }
  // Već preuzeta slika se preskače — ponovno pokretanje je jeftino.
  if (existsSync(file)) {
    imageMap[id] = web;
    skipped++;
    continue;
  }
  try {
    await download(box.image, file);
    imageMap[id] = web;
    downloaded++;
  } catch (err) {
    failed.push(`${id} ← ${box.image} (${err.message})`);
  }
}

/* --- Najtraženiji delovi --- */

/**
 * Prvo po jedan deo od svakog brenda, pa drugi krug, itd. — tako prvih osam
 * kartica na početnoj pokriva osam brendova umesto osam Kverneland raonika.
 */
function interleaveByBrand(entries) {
  const queues = new Map();
  for (const entry of entries) {
    const key = entry.item.brand.key;
    if (!queues.has(key)) queues.set(key, []);
    queues.get(key).push(entry);
  }
  const out = [];
  for (let round = 0; out.length < entries.length; round++) {
    for (const queue of queues.values()) if (queue[round]) out.push(queue[round]);
  }
  return out;
}

const POPULAR_LIMIT = 24;

/**
 * Po jedan deo od svake kombinacije brend + tip dela: bez toga bi vitrina bila
 * pet Kverneland daski i njihovi levi/desni blizanci (isti crtež u ogledalu).
 */
function oneItemPerBrandType(entries) {
  const seen = new Set();
  return entries.filter(({ item }) => {
    const key = `${item.brand?.key}:${item.type?.key}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const popular = interleaveByBrand(
  oneItemPerBrandType([...matched.values()].filter(({ item }) => imageMap[item.id])),
)
  .slice(0, POPULAR_LIMIT)
  .map(({ item }) => ({
    id: item.id,
    name: item.name,
    image: imageMap[item.id],
    facets: item.facets,
    // Oznake za karticu, u istom redu kao u katalogu (grupa, brend, tip, strana).
    tags: [item.group?.label, item.brand?.label, item.type?.label, item.side?.label].filter(
      Boolean,
    ),
  }));

/* --- Upis --- */

if (!DRY) {
  writeFileSync(MAP_FILE, `${JSON.stringify(imageMap, null, 2)}\n`);
  writeFileSync(POPULAR_FILE, `${JSON.stringify(popular, null, 2)}\n`);
}

/* --- Izveštaj --- */

console.log("");
console.log(`Naslova na njihovom sajtu:  ${boxes}`);
console.log(`Povezanih naših delova:     ${matched.size}`);
console.log(`Preuzetih slika:            ${DRY ? "(dry-run)" : downloaded} (preskočeno: ${skipped})`);
console.log(`Najtraženijih (popular):    ${popular.length}`);
console.log(`Nepovezanih naslova:        ${unmatched.length}`);
if (failed.length) {
  console.log(`\nNeuspelo preuzimanje (${failed.length}):`);
  for (const f of failed) console.log(`  ${f}`);
}
if (REPORT) {
  console.log("\nNepovezani naslovi (nemamo taj kataloški broj):");
  for (const u of unmatched) console.log(`  ${u}`);
  console.log("\nPovezano:");
  for (const [id, { item, box }] of matched) {
    console.log(`  ${id.padStart(4)}  ${box.title.padEnd(28)} → ${item.name}`);
  }
}
console.log(DRY ? "\nDRY-RUN — ništa nije upisano." : "\nGotovo.");
