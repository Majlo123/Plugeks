/**
 * Uvozi PRAVE fotografije po proizvodu iz jednog foldera i mapira ih na katalog.
 *
 *   node scripts/import-product-images.mjs [izvorni-folder] [--dry]
 *   (podrazumevano: data/product-photos/)
 *
 * ČEMU SLUŽI: kad dobiješ Rolland dealer paket (ili bilo koji set fotografija
 * delova), samo ubaci sve slike u jedan folder i pokreni ovo. Skripta poveže
 * svaku sliku sa proizvodom i upiše mapu — svaki deo dobija SVOJU fotografiju,
 * bez ručnog rada.
 *
 * KAKO POVEZUJE (bilo koji od tri načina radi):
 *   1) ime fajla = ID proizvoda        →  3943.jpg
 *   2) ime fajla = kataloški broj      →  200123.jpg / 200-123.jpg / 200_123.jpg
 *      (poklapa se sa brojem u nazivu dela; levi/desni varijant dobiju istu sliku)
 *   3) mapa u data/product-photos/map.csv  (redovi: id,imefajla  ili  broj,imefajla)
 *
 * Nepovezane fajlove i proizvode bez slike ispisuje na kraju.
 * Slike se kopiraju u public/images/rolland/{id}.{ext} i upisuje se
 * src/data/images.json. Bezbedno je pokretati više puta.
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync,
} from "node:fs";
import { dirname, resolve, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const SRC = resolve(root, argv.find((a) => !a.startsWith("--")) ?? "data/product-photos");
const IMAGES_DIR = resolve(root, "public/images/rolland");
const MAP_FILE = resolve(root, "src/data/images.json");
const IMG_EXT = /\.(jpe?g|png|webp)$/i;

/* ------------------------------- Katalog ---------------------------------- */

const machines = JSON.parse(readFileSync(resolve(root, "src/data/machines.json"), "utf8"));
const packed = JSON.parse(readFileSync(resolve(root, "src/data/parts.json"), "utf8"));

/** {id, name} za svaki proizvod (mašine + delovi). */
const products = [
  ...machines.map((m) => ({ id: String(m.id), name: m.name })),
  ...packed.items.map((row) => ({ id: String(row[0]), name: row[1] })),
];

const byId = new Map(products.map((p) => [p.id, p]));
// Naziv → samo cifre (za poklapanje kataloškog broja).
const nameDigits = new Map(products.map((p) => [p.id, p.name.replace(/\D/g, "")]));

/* ------------------------------- Ulaz ------------------------------------- */

if (!existsSync(SRC)) {
  console.error(`Nema foldera: ${SRC}`);
  console.error("Ubaci fotografije tamo (ili prosledi putanju kao argument) i pokreni ponovo.");
  process.exit(1);
}

/** Rekurzivno skuplja sve slike ispod SRC (uključujući „…_files" foldere). */
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (IMG_EXT.test(e.name)) out.push(full);
  }
  return out;
}

const files = walk(SRC);
console.log(`Izvor: ${SRC}`);
console.log(`Fotografija: ${files.length}${DRY ? "   (DRY-RUN — ništa se ne kopira)" : ""}\n`);

// Opciona CSV mapa: "kljuc,imefajla" gde je kljuc id ili kataloški broj.
const csvMap = new Map();
const csvPath = resolve(SRC, "map.csv");
if (existsSync(csvPath)) {
  for (const line of readFileSync(csvPath, "utf8").split(/\r?\n/)) {
    const [key, file] = line.split(",").map((s) => s?.trim());
    if (key && file) csvMap.set(file, key.replace(/\D/g, "") || key);
  }
}

/* ----------------------------- Poklapanje --------------------------------- */

/** Vrati listu id-jeva proizvoda za dati „ključ" (id ili kataloški broj). */
function matchProducts(key) {
  if (byId.has(key)) return [key]; // tačan ID
  // Rolland „complete-save" imena: `{id}-{slug}-0-4.jpg` → vodeći broj je ID.
  const lead = key.match(/^(\d+)/)?.[1];
  if (lead && byId.has(lead)) return [lead];
  const digits = key.replace(/\D/g, "");
  if (digits.length < 4) return []; // prekratko → previše lažnih pogodaka
  if (byId.has(digits)) return [digits];
  const hits = [];
  for (const [id, nd] of nameDigits) if (nd.includes(digits)) hits.push(id);
  return hits;
}

const map = existsSync(MAP_FILE) && !DRY ? JSON.parse(readFileSync(MAP_FILE, "utf8")) : {};
if (!DRY) mkdirSync(IMAGES_DIR, { recursive: true });

let copied = 0;
const coveredIds = new Set();
const unmatched = [];
const ambiguous = [];

for (const file of files) {
  const name = basename(file);
  const ext = extname(file).toLowerCase();
  const stem = basename(file, ext);
  const key = csvMap.get(name) ?? stem;

  const ids = matchProducts(key);
  if (ids.length === 0) { unmatched.push(name); continue; }
  if (ids.length > 6) { ambiguous.push(`${name} → ${ids.length} proizvoda`); continue; }

  for (const id of ids) {
    const target = resolve(IMAGES_DIR, `${id}${ext}`);
    if (!DRY) copyFileSync(file, target);
    map[id] = `/images/rolland/${id}${ext}`;
    coveredIds.add(id);
  }
  copied++;
}

if (!DRY) writeFileSync(MAP_FILE, `${JSON.stringify(map, null, 2)}\n`);

/* ------------------------------- Izveštaj --------------------------------- */

console.log(`Povezano fajlova:      ${copied}`);
console.log(`Proizvoda sa slikom:   ${coveredIds.size} / ${products.length}`);
console.log(`Nepovezanih fajlova:   ${unmatched.length}`);
if (ambiguous.length) console.log(`Previše dvosmislenih:  ${ambiguous.length}`);
if (unmatched.length) {
  console.log("\nNepovezani fajlovi (ime ne odgovara nijednom ID-u/kat. broju):");
  for (const f of unmatched.slice(0, 20)) console.log(`  ${f}`);
  if (unmatched.length > 20) console.log(`  … i još ${unmatched.length - 20}`);
}
console.log(DRY ? "\nDRY-RUN gotov. Pokreni bez --dry da se slike stvarno kopiraju." : "\nGotovo.");
