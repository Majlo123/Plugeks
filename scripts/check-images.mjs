/**
 * Provera slika — sve što sajt prikazuje i sve što prijavljuje Google-u.
 *
 *   node scripts/check-images.mjs        (ili: npm run slike:provera)
 *
 * Prolazi kroz SVAKU sliku koju sajt poznaje i javlja:
 *
 *  1. proizvode čija slika u mapi (`images.json`, `machine-images.json`,
 *     `trailers.json`) ne postoji na disku — takva kartica je prazna, a unos u
 *     image sitemap-u vodi na 404;
 *  2. fajlove u folderima proizvoda koje nijedan proizvod ne koristi —
 *     zaostatak posle preimenovanja ili brisanja, nepotrebno u repozitorijumu;
 *  3. slike pogrešnih dimenzija — svaki folder ima svoj kadar (delovi 600x600,
 *     mašine 900x563, prikolice 1200x750), pa slika drugog formata u mreži
 *     kartica štrči (vidi `normalize_product_images.py`);
 *  4. slike sajta (hero, ulazi, kartice kategorija, logo, OG) koje kod
 *     referencira, a fajla nema;
 *  5. koliko proizvoda uopšte nema sliku, po grupi — to nije greška, ali je
 *     spisak onoga što još treba nabaviti.
 *
 * Izlazni kod je 1 kad ima grešaka (1–4), pa se sme zvati i pre objave.
 * Dimenzije čita iz samog fajla (JPEG SOF / PNG IHDR / WebP VP8), bez
 * zavisnosti.
 */

import { readFileSync, readdirSync, existsSync, openSync, readSync, closeSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = resolve(root, "public");
const citaj = (p) => JSON.parse(readFileSync(resolve(root, p), "utf8"));

/* ------------------------------ Dimenzije --------------------------------- */

/** Širina i visina slike iz zaglavlja fajla; `null` kad format nije poznat. */
function dimenzije(putanja) {
  const fd = openSync(putanja, "r");
  try {
    const buf = Buffer.alloc(64 * 1024);
    const n = readSync(fd, buf, 0, buf.length, 0);
    const b = buf.subarray(0, n);

    // PNG: IHDR odmah posle potpisa.
    if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") {
      return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    }
    // WebP (VP8 / VP8L / VP8X).
    if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
      const vrsta = b.toString("ascii", 12, 16);
      if (vrsta === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (vrsta === "VP8L") {
        const bits = b.readUInt32LE(21);
        return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (vrsta === "VP8X") return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
    }
    // JPEG: prvi SOF marker (C0–CF osim C4, C8, CC).
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 9 < n) {
        if (b[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = b[i + 1];
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
          i += 2;
          continue;
        }
        const duzina = b.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        }
        i += 2 + duzina;
      }
    }
    return null;
  } finally {
    closeSync(fd);
  }
}

/* ------------------------------- Proizvodi -------------------------------- */

const images = citaj("src/data/images.json");
const machineImages = citaj("src/data/machine-images.json");
const machines = citaj("src/data/machines.json");
const trailers = citaj("src/data/trailers.json");
const parts = citaj("src/data/parts.json");

/** Ceo katalog kao {id, naziv, grupa, slika}. */
const proizvodi = [
  ...machines.map((m) => ({ id: m.id, naziv: m.name, grupa: `mašine/${m.subgroup}`, slika: machineImages[m.id] ?? images[m.id] })),
  // Fotografije izvedbi i galerija mašine — svaka je „proizvod" za sebe u
  // proveri (postoji li fajl, koristi li se, kadar), ali ne ulaze u brojanje
  // proizvoda bez slike (`bezSlike` gleda samo naslovne).
  ...machines.flatMap((m) =>
    [...(m.galerija ?? []), ...(m.izvedbe ?? []).flatMap((i) => i.slike)].map((slika) => ({
      id: m.id,
      naziv: m.name,
      grupa: `mašine/${m.subgroup}`,
      slika,
      izvedba: true,
    })),
  ),
  ...trailers.map((t) => ({ id: t.id, naziv: t.name, grupa: t.vrsta === "oprema" ? "oprema za prikolice" : "prikolice", slika: t.image })),
  ...parts.items.map(([id, name, g]) => ({ id, naziv: name, grupa: parts.groups[g]?.label ?? "delovi", slika: images[id] })),
];

/** Folder → očekivane dimenzije (vidi `normalize_product_images.py`). */
const KADROVI = {
  "images/rolland": [600, 600],
  "images/plugovi": [600, 600],
  "images/rotodrljace": [600, 600],
  "images/prikolice": [1200, 750],
  "images/masine/hofman": [900, 563],
  "images/masine/hofman/izvedbe": [900, 563],
};

/** Slike sajta koje kod referencira (vidi grep po `"/images/` u `src/`). */
const SLIKE_SAJTA = [
  "og.jpg",
  "images/hero.jpg",
  "images/cta.jpg",
  "images/malceri.jpg",
  "images/galerija-3.jpg",
  "images/delovi.jpg",
  "images/logo-full.png",
  "images/logo-mark.png",
  "images/ulaz/masine.jpg",
  "images/ulaz/delovi.jpg",
  "images/ulaz/prikolice.jpg",
  "images/kategorije/poljoprivredne.jpg",
  "images/kategorije/sumske.jpg",
  "images/kategorije/gradjevinske.jpg",
  "images/kategorije/prikolice.jpg",
  "images/kategorije/delovi.jpg",
];

const greske = [];
const upozorenja = [];

/**
 * Fajlovi foldera, sa podfolderima (izvedbe mašina su po jedan folder po
 * mašini). Podfolder koji je i sam u `KADROVI` se preskače — on se proverava
 * kao svoj folder, a ne još jednom kroz roditelja.
 */
function fajlovi(folder, prefiks = "") {
  const dir = join(PUBLIC, folder);
  return readdirSync(dir, { withFileTypes: true }).flatMap((u) => {
    if (!u.isDirectory()) return [`${prefiks}${u.name}`];
    if (KADROVI[`${folder}/${u.name}`]) return [];
    return fajlovi(`${folder}/${u.name}`, `${prefiks}${u.name}/`);
  });
}

// 1) slika u mapi, a nema fajla
const koriscene = new Set();
for (const p of proizvodi) {
  if (!p.slika) continue;
  const fajl = join(PUBLIC, p.slika);
  koriscene.add(p.slika.replace(/^\//, ""));
  if (!existsSync(fajl)) greske.push(`nema fajla: ${p.slika}  (${p.id} ${p.naziv})`);
}

// 2) fajl bez proizvoda, 3) pogrešne dimenzije
for (const [folder, [w, h]] of Object.entries(KADROVI)) {
  const dir = join(PUBLIC, folder);
  if (!existsSync(dir)) {
    upozorenja.push(`nema foldera ${folder}`);
    continue;
  }
  for (const ime of fajlovi(folder)) {
    const rel = `${folder}/${ime}`;
    if (!/\.(jpe?g|png|webp)$/i.test(ime)) continue;
    if (!koriscene.has(rel)) greske.push(`fajl bez proizvoda: /${rel}`);
    const d = dimenzije(join(dir, ime));
    if (!d) upozorenja.push(`nepoznat format: /${rel}`);
    else if (d.w !== w || d.h !== h) greske.push(`pogrešan kadar ${d.w}x${d.h} (treba ${w}x${h}): /${rel}`);
  }
}

// 4) slike sajta
for (const rel of SLIKE_SAJTA) {
  if (!existsSync(join(PUBLIC, rel))) greske.push(`nema slike sajta: /${rel}`);
}

// 5) proizvodi bez slike, po grupi
const bezSlike = new Map();
for (const p of proizvodi) {
  if (p.slika || p.izvedba) continue;
  bezSlike.set(p.grupa, (bezSlike.get(p.grupa) ?? 0) + 1);
}

/* -------------------------------- Izveštaj -------------------------------- */

const naslovne = proizvodi.filter((p) => !p.izvedba);
const saSlikom = naslovne.filter((p) => p.slika).length;
console.log(`Proizvoda: ${naslovne.length}, sa slikom: ${saSlikom}, bez slike: ${naslovne.length - saSlikom}`);
console.log(`  fotografija izvedbi mašina: ${proizvodi.length - naslovne.length}`);
for (const [grupa, n] of [...bezSlike].sort((a, b) => b[1] - a[1])) {
  console.log(`  bez slike — ${grupa}: ${n}`);
}
for (const [folder] of Object.entries(KADROVI)) {
  const dir = join(PUBLIC, folder);
  if (existsSync(dir)) console.log(`  /${folder}: ${fajlovi(folder).length} fajlova`);
}

if (upozorenja.length) {
  console.log(`\nUpozorenja (${upozorenja.length}):`);
  for (const u of upozorenja) console.log(`  ${u}`);
}
if (greske.length) {
  console.log(`\nGREŠKE (${greske.length}):`);
  for (const g of greske) console.log(`  ${g}`);
  process.exit(1);
}
console.log("\nSve slike su na mestu, u pravom kadru i svaka ima svoj proizvod.");
