/**
 * Preuzima fotografije proizvoda sa rolland.pl i mapira ih na naš katalog.
 *
 *   node scripts/import-images.mjs        (ili: npm run slike)
 *
 * ZAŠTO OVAKO: rolland.pl blokira automatski pristup HTML stranicama, ali
 * `/uploads/...` putanja nije zaštićena — slike se skidaju normalno. Fali samo
 * spisak adresa, koji postoji jedino u HTML-u kategorija.
 *
 * KAKO SE KORISTI:
 *  1. Otvori kategoriju na rolland.pl u svom pretraživaču
 *     (npr. https://www.rolland.pl/pl/maszyny-rolniczne,938/)
 *  2. Ctrl+S → sačuvaj kao „Web stranica, samo HTML" u `data/rolland-pages/`
 *  3. Ponovi za ostale kategorije i strane paginacije
 *  4. `npm run slike`
 *
 * Skripta iz sačuvanog HTML-a izvlači SVE adrese oblika
 *   /uploads/produkt/{godina}/{mesec}/{id}-{slug}-0-4.jpg
 * skida ih u `public/images/rolland/` i zapisuje mapu `src/data/images.json`
 * (id proizvoda → lokalna putanja). Katalog automatski koristi tu sliku ako
 * postoji, inače pada na ilustraciju kategorije.
 *
 * Pokretanje je bezbedno za ponavljanje — već preuzete slike se preskaču.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES_DIR = resolve(root, "data/rolland-pages");
const IMAGES_DIR = resolve(root, "public/images/rolland");
const MAP_FILE = resolve(root, "src/data/images.json");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** `/uploads/produkt/2019/07/1061-grzadziel-kverneland-gk-1-0-4.jpg` → id 1061. */
const IMAGE_RE =
  /https?:\/\/(?:www\.)?rolland\.pl\/+uploads\/produkt\/\d{4}\/\d{2}\/(\d+)-[^"'\s>]+?\.(?:jpg|jpeg|png|webp)/gi;

/* ---------------------------- Skupljanje adresa ---------------------------- */

if (!existsSync(PAGES_DIR)) {
  console.error(`Nema foldera ${PAGES_DIR}.`);
  console.error("Sačuvaj HTML kategorija sa rolland.pl tamo (vidi zaglavlje skripte).");
  process.exit(1);
}

const htmlFiles = readdirSync(PAGES_DIR).filter((f) => /\.html?$/i.test(f));
if (htmlFiles.length === 0) {
  console.error(`U ${PAGES_DIR} nema nijednog .html fajla.`);
  process.exit(1);
}

/** id proizvoda → adresa slike (prva pronađena pobeđuje). */
const found = new Map();
for (const file of htmlFiles) {
  const html = readFileSync(resolve(PAGES_DIR, file), "utf8");
  for (const match of html.matchAll(IMAGE_RE)) {
    // Dupli `//` posle domena je kako ih sajt i ispisuje — normalizujemo.
    const url = match[0].replace(/(?<!:)\/{2,}/g, "/");
    if (!found.has(match[1])) found.set(match[1], url);
  }
}

console.log(`Pregledano stranica: ${htmlFiles.length}`);
console.log(`Pronađeno slika: ${found.size}`);
if (found.size === 0) {
  console.error("\nNijedna adresa nije prepoznata. Proveri da si sačuvao stranicu");
  console.error("kategorije sa proizvodima, a ne npr. početnu stranu.");
  process.exit(1);
}

/* -------------------------------- Preuzimanje ------------------------------ */

mkdirSync(IMAGES_DIR, { recursive: true });

const map = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, "utf8")) : {};
let downloaded = 0;
let skipped = 0;
const failed = [];

for (const [id, url] of found) {
  const ext = extname(new URL(url).pathname).toLowerCase() || ".jpg";
  const fileName = `${id}${ext}`;
  const target = resolve(IMAGES_DIR, fileName);

  if (existsSync(target)) {
    map[id] = `/images/rolland/${fileName}`;
    skipped++;
    continue;
  }

  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new Error(`nije slika (${type})`);

    writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    map[id] = `/images/rolland/${fileName}`;
    downloaded++;
    if (downloaded % 25 === 0) console.log(`  …preuzeto ${downloaded}`);
  } catch (err) {
    failed.push(`${id}: ${err.message}`);
  }

  // Pauza između zahteva — ne opterećujemo tuđi server.
  await new Promise((r) => setTimeout(r, 150));
}

writeFileSync(MAP_FILE, `${JSON.stringify(map, null, 2)}\n`);

console.log(`\nPreuzeto: ${downloaded}`);
console.log(`Već postojalo: ${skipped}`);
console.log(`Ukupno u mapi: ${Object.keys(map).length}`);
if (failed.length) {
  console.log(`\nNeuspešno (${failed.length}):`);
  for (const f of failed.slice(0, 15)) console.log(`  ${f}`);
}
