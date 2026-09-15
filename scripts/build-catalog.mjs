/**
 * Generiše katalog rezervnih delova.
 *
 *   node scripts/build-catalog.mjs        (ili: npm run catalog)
 *
 * Ulaz:  data/rolland-sitemap.xml      — preuzet sa https://www.rolland.pl/sitemap.xml
 *        src/data/ferencak.json        — delovi za roto drljače, drljače, freze,
 *                                        setvospremače i tanjirače, piše ih
 *                                        `npm run ferencak` (vidi import-ferencak.mjs)
 * Izlaz: src/data/parts.json           — SVI delovi, kolonarno spakovani (učitava se lazy)
 *        src/data/popular.json         — osveženi nazivi/fasete najtraženijih delova
 *
 * Osvežavanje Rolland kataloga:
 *   curl -o data/rolland-sitemap.xml https://www.rolland.pl/sitemap.xml
 *   npm run catalog
 *
 * Prevode i brendove menjaš u scripts/rolland-dictionary.mjs.
 *
 * MAŠINE SE OVDE VIŠE NE GENERIŠU: Rolland mašine (plavi program) su skinute sa
 * sajta odlukom vlasnika, a `src/data/machines.json` piše isključivo
 * `npm run masine` (Hofman). Ova skripta ga ne dira.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
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
} from "./rolland-dictionary.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = resolve(root, "data/rolland-sitemap.xml");
const OUT_DIR = resolve(root, "src/data");
const FERENCAK = resolve(OUT_DIR, "ferencak.json");
const POPULAR = resolve(OUT_DIR, "popular.json");

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

/**
 * Preostale tokene pretvara u čitljiv nastavak naziva (model + kataloški broj).
 *
 * `typeLabel` je naziv tipa koji već stoji na početku imena: pridev koji bi ga
 * samo ponovio se preskače. Bez toga je „odkladniczka-goudland-przedpluzka"
 * davalo „Daska predplužnjaka Goudland predplužnjaka".
 */
function formatRest(tokens, typeLabel = "") {
  const words = [];
  const codes = [];
  // Poređenje po celim rečima: „za" nije u „Zakivak", iako je njegov deo.
  const reciTipa = new Set(typeLabel.toLowerCase().split(/[\s/()]+/).filter(Boolean));
  const uTipu = (rec) => rec.toLowerCase().split(" ").every((w) => reciTipa.has(w));
  for (const t of tokens) {
    if (!t) continue;
    if (DESCRIPTORS[t]) {
      if (!uTipu(DESCRIPTORS[t])) words.push(DESCRIPTORS[t]);
    } else if (/\d/.test(t)) {
      codes.push(t.toUpperCase());
    } else if (t.length <= 4) {
      words.push(t.toUpperCase()); // oznake serija: KS, MU, GWR, SRP…
    } else {
      words.push(t.charAt(0).toUpperCase() + t.slice(1));
    }
  }
  // Predlog kome je ispala imenica („za raonika" → „za") ne ostaje da visi.
  if (words[words.length - 1] === "za") words.pop();
  return { words, code: codes.join(" ") };
}

/* -------------------------------------------------------------------------- */
/*                                   Mapiranje                                 */
/* -------------------------------------------------------------------------- */

/**
 * „Tanjir" znači dva različita dela: u plugu je to tanjirasto crtalo, a u
 * tanjirači disk od pola metra naviše. Rolland katalog za oba ima isti tip, pa
 * se onaj iz grupe tanjirača prevodi u tip koji nose i diskovi sa
 * psc-ferencak.hr — jedan deo, jedan tip u filteru.
 */
function fixTanjir(part) {
  if (part.group !== "delovi-tanjirace" || part.partType !== "tanjir") return part;
  return {
    ...part,
    name: part.name.replace(/^Tanjir \(disk\)/, "Disk tanjirače"),
    partType: "disk-tanjirace",
    partTypeLabel: "Disk tanjirače",
  };
}

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

  // Složeni naziv (npr. „ploza-dluga" → „Dugi plaz") ima prednost nad osnovnim —
  // i za naziv i, kad nosi `key`, za tip u filteru (vidi NAME_PREFIXES).
  const joined = tokens.join("-");
  const prefix = NAME_PREFIXES.find((p) => joined.startsWith(`${p.prefix}-`) || joined === p.prefix);
  const typeLabel = prefix?.label ?? partType?.label ?? capitalize(typeToken ?? "Deo");
  const typeKey = prefix?.key ?? partType?.key ?? "ostalo";
  const consumed = prefix ? prefix.prefix.split("-").length : partType ? 1 : 0;

  const { brand, tokens: rest } = extractBrand(tokens.slice(consumed));
  const { words, code } = formatRest(rest, typeLabel);

  const name = [typeLabel, brand?.label ?? "", words.join(" "), code]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return fixTanjir({
    id: entry.sourceId,
    name: side ? `${name} (${side.suffix})` : name,
    group: group.key,
    partType: typeKey,
    partTypeLabel: typeLabel,
    brand: brand?.key ?? "univerzalno",
    side: side?.key ?? null,
  });
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* -------------------------------------------------------------------------- */
/*                                     Main                                    */
/* -------------------------------------------------------------------------- */

const entries = readSitemap().map(splitUrl).filter(Boolean);

const parts = [];
const unknownTypes = new Map();

for (const entry of entries) {
  const group = GROUPS[entry.groupSlug];
  if (!group) continue;

  const part = buildPart(entry, group);
  if (part.partType === "ostalo" && !PART_TYPES[entry.slug.split("-")[0]]) {
    const t = entry.slug.split("-")[0];
    unknownTypes.set(t, (unknownTypes.get(t) ?? 0) + 1);
  }
  parts.push(part);
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

/**
 * Delovi sa psc-ferencak.hr dolaze iz drugog izvora i drugom skriptom
 * (`npm run ferencak`), već prevedeni i sa našim kataloškim brojevima. Ovde
 * se samo pridružuju Rolland delovima, da sajt ima JEDAN `parts.json`.
 */
const ferencak = existsSync(FERENCAK) ? JSON.parse(readFileSync(FERENCAK, "utf8")) : [];

const finalParts = dedupe([...parts, ...ferencak]);

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
    idx("groups", p.group, groupLabel(p)),
    idx("types", p.partType, partTypeLabel(p)),
    idx("brands", p.brand, brandLabel(p)),
    idx("sides", p.side, p.side === "levi" ? "Levi" : "Desni"),
  ]);

  return { ...tables, items: rows };
}

// Red iz drugog izvora (roto drljače) nosi svoje nazive grupe/tipa/brenda; Rolland
// red ih dobija iz rečnika.
const groupLabel = (p) =>
  p.groupLabel ?? Object.values(GROUPS).find((g) => g.key === p.group)?.label ?? p.group;
const partTypeLabel = (p) =>
  p.partTypeLabel ??
  Object.values(PART_TYPES).find((t) => t.key === p.partType)?.label ??
  "Ostali delovi";
const brandLabel = (p) =>
  p.brandLabel ?? BRANDS.find((b) => b.key === p.brand)?.label ?? "Univerzalno / bez oznake";

/**
 * `popular.json` (vitrina najtraženijih delova) nosi KOPIJU naziva i faseta —
 * mali fajl koji ide u klijentski bundle. Kad se promeni rečnik (novi tip,
 * drugačiji naziv), kopija bi ostala stara, pa kartica na početnoj ne bi
 * odgovarala stranici dela. Zato se posle svakog pakovanja osveži iz istih
 * podataka; ko je u vitrini i kojim redom i dalje bira `npm run plugovi`.
 */
function refreshPopular(packed) {
  if (!existsSync(POPULAR)) return 0;
  const popular = JSON.parse(readFileSync(POPULAR, "utf8"));
  const byId = new Map(packed.items.map((row) => [row[0], row]));
  const at = (table, i) => (i >= 0 ? table[i] : undefined);

  const fresh = popular.flatMap((p) => {
    const row = byId.get(p.id);
    if (!row) return []; // deo je nestao iz kataloga — ispada i iz vitrine
    const [, name, g, t, b, s] = row;
    const group = at(packed.groups, g);
    const type = at(packed.types, t);
    const brand = at(packed.brands, b);
    const side = at(packed.sides, s);
    return [
      {
        ...p,
        name,
        facets: {
          ...(group && { grupa: group.key }),
          ...(type && { tip: type.key }),
          ...(brand && { brend: brand.key }),
          ...(side && { strana: side.key }),
        },
        tags: [group?.label, brand?.label, type?.label, side?.label].filter(Boolean),
      },
    ];
  });

  writeFileSync(POPULAR, `${JSON.stringify(fresh, null, 2)}\n`);
  return fresh.length;
}

mkdirSync(OUT_DIR, { recursive: true });
const packed = pack(finalParts);
writeFileSync(resolve(OUT_DIR, "parts.json"), JSON.stringify(packed));
const uVitrini = refreshPopular(packed);

console.log(`Delovi: ${finalParts.length} (Rolland ${dedupe(parts).length} + psc-ferencak ${ferencak.length})`);
console.log(`Tipova: ${packed.types.length}, brendova: ${packed.brands.length}, grupa: ${packed.groups.length}`);
console.log(`Najtraženiji (popular.json) osveženo: ${uVitrini}`);
if (unknownTypes.size) {
  console.log("\nNeprepoznati tipovi delova (dodaj u PART_TYPES ako su bitni):");
  for (const [t, n] of [...unknownTypes].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${String(n).padStart(5)}  ${t}`);
  }
}
