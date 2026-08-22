/**
 * Generiše katalog proizvoda iz Rolland sitemap-a.
 *
 *   node scripts/build-catalog.mjs        (ili: npm run catalog)
 *
 * Ulaz:  data/rolland-sitemap.xml   — preuzet sa https://www.rolland.pl/sitemap.xml
 * Izlaz: src/data/machines.json     — mašine (mali fajl, ide u glavni bundle)
 *        src/data/parts.json        — delovi (veliki fajl, učitava se lazy)
 *
 * Osvežavanje kataloga:
 *   curl -o data/rolland-sitemap.xml https://www.rolland.pl/sitemap.xml
 *   npm run catalog
 *
 * Prevode i brendove menjaš u scripts/rolland-dictionary.mjs.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GROUPS,
  PART_TYPES,
  NAME_PREFIXES,
  BRANDS,
  SIDES,
  DESCRIPTORS,
  TOKEN_FIXES,
  MACHINES,
} from "./rolland-dictionary.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = resolve(root, "data/rolland-sitemap.xml");
const OUT_DIR = resolve(root, "src/data");

/* -------------------------------------------------------------------------- */
/*                                   Parsing                                  */
/* -------------------------------------------------------------------------- */

/** Izvlači listu URL-ova proizvoda iz sitemap XML-a. */
function readSitemap() {
  const xml = readFileSync(SITEMAP, "utf8");
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => u.endsWith(".html"));
}

/** `/pl/czesci-do-plugow/lemiesz-kuhn-huard-583-103-lewy,1582.html` → delovi. */
function splitUrl(url) {
  const m = url.match(/\/pl\/([^/]+)\/(.+),(\d+)\.html$/);
  if (!m) return null;
  return { groupSlug: m[1], slug: m[2], sourceId: m[3], url };
}

/**
 * Skida oznaku strane (`lewy` / `prawa` …) gde god da se nađe u slug-u —
 * najčešće je na kraju, ali kod dela naziva stoji u sredini.
 */
function extractSide(tokens) {
  let side = null;
  const rest = tokens.filter((t) => {
    if (!SIDES[t]) return true;
    side ??= SIDES[t];
    return false;
  });
  return { tokens: rest, side };
}

/** Nalazi brend u nizu tokena; vraća {brand, tokens} bez brend-tokena. */
function extractBrand(tokens) {
  const joined = tokens.join("-");
  for (const brand of BRANDS) {
    for (const pattern of brand.match) {
      const re = new RegExp(`(^|-)${pattern}(-|$)`);
      if (!re.test(joined)) continue;
      const parts = pattern.split("-");
      const idx = tokens.findIndex((_, i) =>
        parts.every((p, j) => tokens[i + j] === p),
      );
      const rest = idx === -1 ? tokens : [...tokens.slice(0, idx), ...tokens.slice(idx + parts.length)];
      return { brand, tokens: rest };
    }
  }
  return { brand: null, tokens };
}

/** Preostale tokene pretvara u čitljiv nastavak naziva (model + kataloški broj). */
function formatRest(tokens) {
  const words = [];
  const codes = [];
  for (const t of tokens) {
    if (!t) continue;
    if (DESCRIPTORS[t]) {
      words.push(DESCRIPTORS[t]);
    } else if (/\d/.test(t)) {
      codes.push(t.toUpperCase());
    } else if (t.length <= 4) {
      words.push(t.toUpperCase()); // oznake serija: KS, MU, GWR, SRP…
    } else {
      words.push(t.charAt(0).toUpperCase() + t.slice(1));
    }
  }
  return { words, code: codes.join(" ") };
}

/* -------------------------------------------------------------------------- */
/*                                   Mapiranje                                 */
/* -------------------------------------------------------------------------- */

function buildPart(entry, group) {
  const rawTokens = entry.slug
    .split("-")
    .filter(Boolean)
    .map((t) => TOKEN_FIXES[t] ?? t);
  const { tokens: noSide, side } = extractSide(rawTokens);

  // Kad je strana poznata, `-l-` / `-r-` u sredini slug-a je duplikat oznake.
  const tokens = side ? noSide.filter((t) => t !== "l" && t !== "r") : noSide;

  const typeToken = tokens[0];
  const partType = PART_TYPES[typeToken] ?? null;

  // Složeni naziv (npr. „ploza-dluga” → „Dugi plaz”) ima prednost nad osnovnim.
  const joined = tokens.join("-");
  const prefix = NAME_PREFIXES.find((p) => joined.startsWith(`${p.prefix}-`) || joined === p.prefix);
  const typeLabel = prefix?.label ?? partType?.label ?? capitalize(typeToken ?? "Deo");
  const consumed = prefix ? prefix.prefix.split("-").length : partType ? 1 : 0;

  const { brand, tokens: rest } = extractBrand(tokens.slice(consumed));
  const { words, code } = formatRest(rest);

  const name = [typeLabel, brand?.label ?? "", words.join(" "), code]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    id: entry.sourceId,
    name: side ? `${name} (${side.suffix})` : name,
    group: group.key,
    partType: partType?.key ?? "ostalo",
    brand: brand?.key ?? "univerzalno",
    side: side?.key ?? null,
  };
}

function buildMachine(entry, group) {
  const known = MACHINES[entry.slug];
  return {
    id: entry.sourceId,
    name: known?.name ?? capitalize(entry.slug.replace(/-/g, " ")),
    group: group.key,
    subgroup: known?.subgroup ?? "ostalo",
    tagline: known?.tagline ?? "",
    brand: "rolland",
  };
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* -------------------------------------------------------------------------- */
/*                                     Main                                    */
/* -------------------------------------------------------------------------- */

const entries = readSitemap().map(splitUrl).filter(Boolean);

const machines = [];
const parts = [];
const unknownTypes = new Map();

for (const entry of entries) {
  const group = GROUPS[entry.groupSlug];
  if (!group) continue;

  if (group.type === "masine") {
    machines.push(buildMachine(entry, group));
  } else {
    const part = buildPart(entry, group);
    if (part.partType === "ostalo" && !PART_TYPES[entry.slug.split("-")[0]]) {
      const t = entry.slug.split("-")[0];
      unknownTypes.set(t, (unknownTypes.get(t) ?? 0) + 1);
    }
    parts.push(part);
  }
}

// Deduplikacija po nazivu + grupi (sitemap ume da ponovi isti proizvod).
const dedupe = (list) => {
  const seen = new Set();
  return list.filter((p) => {
    const k = `${p.group}|${p.name}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const finalMachines = dedupe(machines);
const finalParts = dedupe(parts);

/**
 * Delovi se pakuju kolonarno: umesto da se `delovi-plugovi` ponovi 4600 puta,
 * čuva se indeks u tabelu. Fajl padne sa ~1,4 MB na ~350 KB, što je bitno jer
 * se učitava u pretraživač (doduše tek kad korisnik izabere „Delovi”).
 */
function pack(items) {
  const tables = { groups: [], types: [], brands: [], sides: [] };
  const index = { groups: new Map(), types: new Map(), brands: new Map(), sides: new Map() };

  const idx = (table, key, label) => {
    if (key == null) return -1;
    if (!index[table].has(key)) {
      index[table].set(key, tables[table].length);
      tables[table].push({ key, label });
    }
    return index[table].get(key);
  };

  const rows = items.map((p) => [
    p.id,
    p.name,
    idx("groups", p.group, groupLabel(p.group)),
    idx("types", p.partType, partTypeLabel(p.partType)),
    idx("brands", p.brand, brandLabel(p.brand)),
    idx("sides", p.side, p.side === "levi" ? "Levi" : "Desni"),
  ]);

  return { ...tables, items: rows };
}

const groupLabel = (key) =>
  Object.values(GROUPS).find((g) => g.key === key)?.label ?? key;
const partTypeLabel = (key) =>
  Object.values(PART_TYPES).find((t) => t.key === key)?.label ?? "Ostali delovi";
const brandLabel = (key) =>
  BRANDS.find((b) => b.key === key)?.label ?? "Univerzalno / bez oznake";

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, "machines.json"), JSON.stringify(finalMachines, null, 2));
writeFileSync(resolve(OUT_DIR, "parts.json"), JSON.stringify(pack(finalParts)));

console.log(`Mašine: ${finalMachines.length}`);
console.log(`Delovi: ${finalParts.length}`);
if (unknownTypes.size) {
  console.log("\nNeprepoznati tipovi delova (dodaj u PART_TYPES ako su bitni):");
  for (const [t, n] of [...unknownTypes].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${String(n).padStart(5)}  ${t}`);
  }
}
