/**
 * Uvozi program mašina sa hofman.at u naš katalog — poljoprivrednu, šumsku i
 * građevinsku mehanizaciju plus baštenske mašine.
 *
 *   node scripts/import-hofman.mjs            (ili: npm run masine)
 *   node scripts/import-hofman.mjs --stablo   (samo ispiše nađeno, ne upisuje)
 *   node scripts/import-hofman.mjs --osvezi   (baci keš i skine sve iznova)
 *
 * ZAŠTO OVAKO: izvor nema sitemap (`/sitemap.xml` vraća početnu stranu), a
 * stranice grana (`/hr/poljoprivredna-mehanizacija`) su predstavne — bez mreže
 * proizvoda. Ceo spisak kategorija zato stoji u `IZVOR` ispod (prepisan iz
 * mega-menija, koji je na svakoj strani sajta), a od svake kategorije se silazi
 * kroz mreže do stranica pojedinačnih mašina.
 *
 * Čita se HRVATSKA verzija (`/hr/`) — najbliža srpskom od ponuđenih; dve
 * kategorije postoje samo na engleskoj, pa im putanja počinje sa `/en/`.
 *
 * NAZIVI SE NE PREUZIMAJU SA IZVORA. Izvorni prevod je mašinski i mestimično
 * pogrešan („Četkice" za cepače drva, „Kružne stepenice" za tanjirače,
 * „Friziraj" za freze), a to su baš reči po kojima nas kupac traži. Zato svaka
 * kategorija u `IZVOR` nosi našu imenicu, a sa izvora se uzima samo fabrička
 * oznaka modela (JASA, ARGA, G LINE) — nju i ne treba prevoditi.
 *
 * ŠTA RADI:
 *  1. siđe kroz mreže svake kategorije i skupi stranice mašina
 *  2. sa svake čita naziv modela i fotografije
 *  3. skida naslovnu fotografiju u `data/hofman-originals/`
 *  4. sa slovenačke verzije čita tabele modela (na ostalima su prazne)
 *  5. dopunjava `src/data/machines.json` i `src/data/machine-images.json`
 *
 * ŠTA NAMERNO NE RADI: ne prenosi cene (PlugekS radi po upitu, vidi `offers` u
 * ProductJsonLd) i ne prepisuje marketinški tekst — opis mašine se sastavlja
 * kod nas, u `machineDescription()` (`src/lib/products.ts`).
 *
 * SLIKE ZA SAJT kadrira `scripts/normalize_product_images.py masine`
 * (`npm run masine:slike`) — ovde se skida samo sirov original.
 *
 * Pokretanje je bezbedno za ponavljanje: stranice i slike se keširaju u
 * `data/hofman-cache/`, pa drugo pokretanje ne dira izvor.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = resolve(root, "data/hofman-cache");
const ORIGINALS_DIR = resolve(root, "data/hofman-originals");
const MACHINES_FILE = resolve(root, "src/data/machines.json");
const GROUPS_FILE = resolve(root, "src/data/machine-groups.json");
const IMAGES_FILE = resolve(root, "src/data/machine-images.json");

const ORIGIN = "https://hofman.at";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Pauza između zahteva — izvor je mali sajt, ne gura se. */
const PAUZA_MS = 350;

/** Kataloški brojevi Hofman mašina. Rolland staje na 4790, prikolice od 9001. */
const ID_OD = 5001;

/* ------------------------------- Naša podela ------------------------------ */

/**
 * Grane i tipovi mašina — NAŠA podela, namerno plića od izvorne.
 *
 * Izvor grana katalog na četiri nivoa („Košnja trave → Prikupljači → Rotorski
 * sakupljači → TORO"), pa kupac koji traži grabulje prolazi kroz tri strane pre
 * nego što je vidi. Ovde je stablo spljošteno na dva nivoa: grana → tip mašine,
 * a u tipu stoje sve mašine tog tipa.
 *
 * Komunalna mehanizacija se NE uvozi — nije u ponudi (odluka vlasnika).
 * Baštenske mašine (izvorno „GARDEN MACHINES") idu pod poljoprivredne: to su
 * male verzije istog alata i zbog dve mašine se ne otvara četvrta grana.
 */
export const GRANE = {
  poljoprivredne: {
    label: "Poljoprivredne mašine",
    kratko: "Poljoprivredne",
    opis: "Mašine za obradu zemljišta, košenje i spremanje sena, setvu, zaštitu bilja, pripremu hrane i transport na gazdinstvu.",
    // Prva četiri tipa su Rolland program, koji je na sajtu od ranije i ima
    // svoje indeksirane adrese (`/masine/tanjirace`…). Ne stapaju se u
    // „Plugovi i mašine za obradu" iako tu po nameni spadaju: „tanjirača" i
    // „podrivač" su reči koje kupac stvarno kuca u pretragu, pa svaka i dalje
    // zaslužuje svoju stranu.
    tipovi: {
      tanjirace: "Tanjirače",
      agregati: "Agregati",
      podrivaci: "Podrivači",
      valjci: "Valjci",
      "obrada-zemljista": "Plugovi i mašine za obradu",
      malceri: "Malčeri i freze",
      kosenje: "Kosačice, grabulje i balirke",
      "setva-zetva": "Sejalice i kombajni",
      "prskalice-rasipaci": "Prskalice i rasipači đubriva",
      "traktorske-prikolice": "Traktorske prikolice i kiperi",
      "mesaone-mlinovi": "Mešaone i mlinovi",
      "bastenske-masine": "Baštenske mašine",
      tegovi: "Tegovi za traktore",
    },
  },
  sumske: {
    label: "Šumske mašine",
    kratko: "Šumske",
    opis: "Cepači drva, iverači, kružne pile i prikolice za rad u šumi i pripremu ogreva.",
    tipovi: {
      cepaci: "Cepači drva",
      iveraci: "Iverači i drobilice grana",
      "pile-testere": "Kružne pile i mašine za rezanje",
      "sumske-prikolice": "Šumske prikolice i transport",
      "klesta-prikljucci": "Klešta, vezači i priključci",
    },
  },
  gradjevinske: {
    label: "Građevinske mašine",
    kratko: "Građevinske",
    opis: "Mini bageri, utovarivači i dumperi za iskope, zemljane radove i uređenje terena.",
    tipovi: {
      "mini-bageri": "Mini bageri",
      "mini-utovarivaci": "Mini utovarivači",
      "mini-dumperi": "Mini dumperi",
    },
  },
};

/**
 * Kategorije na izvoru → naš tip + naša imenica za mašinu.
 *
 * `naziv` je ono što staje ispred fabričke oznake: „Kosačica" + „JASA".
 * `dodatak` razdvaja modele iste oznake — cepač REX postoji u četiri pogona, pa
 * bi bez toga katalog imao četiri reda „Cepač drva REX".
 *
 * Prazan `naziv` znači da naslov strane već nosi ceo naziv (retko).
 */
const IZVOR = {
  /* --- Poljoprivredne: malčeri i freze --- */
  "univerzalni-malceri": { grana: "poljoprivredne", tip: "malceri", naziv: "Malčer" },
  "g-line": { grana: "poljoprivredne", tip: "malceri", naziv: "Malčer" },
  "f-line": { grana: "poljoprivredne", tip: "malceri", naziv: "Malčer" },
  "m-line": { grana: "poljoprivredne", tip: "malceri", naziv: "Malčer" },
  "pro-line": { grana: "poljoprivredne", tip: "malceri", naziv: "Malčer" },
  "duo-line": { grana: "poljoprivredne", tip: "malceri", naziv: "Malčer" },
  "bocni-mulceri": { grana: "poljoprivredne", tip: "malceri", naziv: "Bočni malčer" },
  "mulceri-b-line-na-hidraulickoj-ruci": { grana: "poljoprivredne", tip: "malceri", naziv: "Malčer na hidrauličnoj ruci" },
  "mulceri-r-line-na-hidraulickoj-ruci": { grana: "poljoprivredne", tip: "malceri", naziv: "Malčer na hidrauličnoj ruci" },
  "sadjarsko-vinogradnicki-malceri": { grana: "poljoprivredne", tip: "malceri", naziv: "Voćarsko-vinogradarski malčer" },
  "rotacijski-malceri": { grana: "poljoprivredne", tip: "malceri", naziv: "Rotacioni malčer" },
  friziraj: { grana: "poljoprivredne", tip: "malceri", naziv: "Freza" },
  muljaci: { grana: "poljoprivredne", tip: "malceri", naziv: "Malčer" },

  /* --- Poljoprivredne: košenje i spremanje sena --- */
  "kosnja-trave": { grana: "poljoprivredne", tip: "kosenje", naziv: "Kosačica" },
  kosilice: { grana: "poljoprivredne", tip: "kosenje", naziv: "Kosačica" },
  rotatori: { grana: "poljoprivredne", tip: "kosenje", naziv: "Okretač sena" },
  prikupljaci: { grana: "poljoprivredne", tip: "kosenje", naziv: "Grabulja" },
  "rotorski-sakupljaci": { grana: "poljoprivredne", tip: "kosenje", naziv: "Rotaciona grabulja" },
  "dvokotacni-grabljaci": { grana: "poljoprivredne", tip: "kosenje", naziv: "Dvorotorska grabulja" },
  trakacipresavijaci: { grana: "poljoprivredne", tip: "kosenje", naziv: "Trakasta grabulja" },
  balirke: { grana: "poljoprivredne", tip: "kosenje", naziv: "Balirka" },
  arga: { grana: "poljoprivredne", tip: "kosenje", naziv: "Rolo balirka" },
  "prese-za-kockaste-bale": { grana: "poljoprivredne", tip: "kosenje", naziv: "Presa za kockaste bale" },
  "omotaci-za-bale": { grana: "poljoprivredne", tip: "kosenje", naziv: "Omotač bala" },
  "bale-grippers": { grana: "poljoprivredne", tip: "kosenje", naziv: "Hvatač bala", jezik: "en" },

  /* --- Poljoprivredne: obrada zemljišta --- */
  "obrada-tla": { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Mašina za obradu zemljišta" },
  plugi: { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Plug" },
  gruberji: { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Gruber" },
  predlosci: { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Setvospremač" },
  "fiksni-prijedlozi": { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Setvospremač", dodatak: "fiksni" },
  "hidraulicki-sklopivi-predsjedaci": { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Setvospremač", dodatak: "hidraulično sklopivi" },
  "globinski-podupiraci": { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Podrivač" },
  "kruzne-stepenice": { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Tanjirača" },
  "cambdridge-valji": { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Cambridge valjak" },
  "rezni-valjci": { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Rezni valjak" },
  "travnicke-brane": { grana: "poljoprivredne", tip: "obrada-zemljista", naziv: "Livadska drljača" },

  /* --- Poljoprivredne: setva i žetva --- */
  "sjetvena-i-zetvena-tehnika": { grana: "poljoprivredne", tip: "setva-zetva", naziv: "Sejalica" },
  sejalnice: { grana: "poljoprivredne", tip: "setva-zetva", naziv: "Sejalica" },
  zitnokombajni: { grana: "poljoprivredne", tip: "setva-zetva", naziv: "Silažni kombajn" },

  /* --- Poljoprivredne: prskalice i rasipači --- */
  "prskalna-tehnika": { grana: "poljoprivredne", tip: "prskalice-rasipaci", naziv: "Prskalica" },
  "prijenosne-prskalice": { grana: "poljoprivredne", tip: "prskalice-rasipaci", naziv: "Nošena prskalica" },
  "prijenosni-prskalici": { grana: "poljoprivredne", tip: "prskalice-rasipaci", naziv: "Voćarski atomizer" },
  "rasprsivaci-umjetnih-gnojiva": { grana: "poljoprivredne", tip: "prskalice-rasipaci", naziv: "Rasipač đubriva" },
  "noseni-rasipaci": { grana: "poljoprivredne", tip: "prskalice-rasipaci", naziv: "Rasipač đubriva" },

  /* --- Poljoprivredne: prikolice i kiperi --- */
  "traktorske-prikolice-i-platforme": { grana: "poljoprivredne", tip: "traktorske-prikolice", naziv: "Traktorska prikolica" },
  prikolice: { grana: "poljoprivredne", tip: "traktorske-prikolice", naziv: "Traktorska prikolica" },
  "hidraulicne-platforme": { grana: "poljoprivredne", tip: "traktorske-prikolice", naziv: "Hidraulična kiper platforma" },
  "mehanicki-platoi": { grana: "poljoprivredne", tip: "traktorske-prikolice", naziv: "Mehanička kiper platforma" },

  /* --- Poljoprivredne: mešaone i mlinovi --- */
  "upravljacki-strojevi": { grana: "poljoprivredne", tip: "mesaone-mlinovi", naziv: "Mešaona stočne hrane" },
  "mjesaci-hrane": { grana: "poljoprivredne", tip: "mesaone-mlinovi", naziv: "Mešaona stočne hrane" },
  "mlinovi-za-zito": { grana: "poljoprivredne", tip: "mesaone-mlinovi", naziv: "Mlin za žito" },

  /* --- Poljoprivredne: baštenske mašine i tegovi --- */
  "vrtni-strojevi": { grana: "poljoprivredne", tip: "bastenske-masine", naziv: "Baštenska mašina" },
  tegovi: { grana: "poljoprivredne", tip: "tegovi", naziv: "Teg za traktor" },
  "utezi-za-traktore": { grana: "poljoprivredne", tip: "tegovi", naziv: "Teg za traktor" },

  /* --- Šumske: cepači drva --- */
  cetkice: { grana: "sumske", tip: "cepaci", naziv: "Cepač drva" },
  "pogonski-vratila-na-kardan-max": { grana: "sumske", tip: "cepaci", naziv: "Cepač drva", dodatak: "kardanski pogon" },
  "cjepaci-na-kardanski-pogon-rex": { grana: "sumske", tip: "cepaci", naziv: "Cepač drva", dodatak: "kardanski pogon" },
  "kombinirane-cetkice-elektro-kardan": { grana: "sumske", tip: "cepaci", naziv: "Cepač drva", dodatak: "elektro i kardanski pogon" },
  "elektricni-cetkaci": { grana: "sumske", tip: "cepaci", naziv: "Cepač drva", dodatak: "električni pogon" },
  "pogonjeni-drobilnici-s-benzenskim-motorom": { grana: "sumske", tip: "cepaci", naziv: "Cepač drva", dodatak: "benzinski motor" },

  /* --- Šumske: iverači, pile, prikolice, priključci --- */
  "drobilci-grana": { grana: "sumske", tip: "iveraci", naziv: "Iverač" },
  "kruzne-pile": { grana: "sumske", tip: "pile-testere", naziv: "Kružna pila" },
  "rezacko-brusilni-strojevi": { grana: "sumske", tip: "pile-testere", naziv: "Mašina za rezanje i cepanje drva" },
  "sumske-prikolice": { grana: "sumske", tip: "sumske-prikolice", naziv: "Šumska prikolica" },
  "transportne-trake": { grana: "sumske", tip: "sumske-prikolice", naziv: "Transportna traka" },
  "traktorske-prikolice-i-platforme-2": { grana: "sumske", tip: "sumske-prikolice", naziv: "Traktorska prikolica" },
  "prikolice-2": { grana: "sumske", tip: "sumske-prikolice", naziv: "Traktorska prikolica" },
  "hidraulicne-platforme-2": { grana: "sumske", tip: "sumske-prikolice", naziv: "Hidraulična kiper platforma" },
  "mehanicki-tanjuri": { grana: "sumske", tip: "sumske-prikolice", naziv: "Mehanička kiper platforma" },
  "klijesta-za-drva": { grana: "sumske", tip: "klesta-prikljucci", naziv: "Klešta za trupce" },
  "spojnice-za-drva": { grana: "sumske", tip: "klesta-prikljucci", naziv: "Vezač drva" },
  "alat-i-pribor": { grana: "sumske", tip: "klesta-prikljucci", naziv: "Priključak za šumarstvo" },
  "pomagala-i-prikljucci": { grana: "sumske", tip: "klesta-prikljucci", naziv: "Priključak za šumarstvo" },
  "pomagala-i-prikljucci-2": { grana: "sumske", tip: "klesta-prikljucci", naziv: "Priključak za šumarstvo" },

  /* --- Građevinske --- */
  bagri: { grana: "gradjevinske", tip: "mini-bageri", naziv: "Mini bager" },
  "mini-bagri": { grana: "gradjevinske", tip: "mini-bageri", naziv: "Mini bager" },
  "mini-loaders": { grana: "gradjevinske", tip: "mini-utovarivaci", naziv: "Mini utovarivač", jezik: "en" },
  "mini-odbojnici-amortizeri": { grana: "gradjevinske", tip: "mini-dumperi", naziv: "Mini dumper" },
  "mini-bageri-gusjenicari": { grana: "gradjevinske", tip: "mini-dumperi", naziv: "Mini dumper guseničar" },
};

/**
 * Oznaka modela kad je naslov na izvoru neupotrebljiv — mašinski preveden
 * („G LINIJA" umesto „G LINE"), rečenica umesto oznake („SUKI MINI BAGER S
 * PUNO DODATNE OPREME") ili prosto ponovljen naziv kategorije.
 *
 * Ključ je putanja na izvoru; `""` znači da model nema oznaku, pa se mašina
 * zove samo našom imenicom („Iverač").
 */
const ISPRAVKE = {
  "/hr/g-line/g-linija": "G LINE",
  "/hr/mulceri-b-line-na-hidraulickoj-ruci/b-linija-na-hidraulicnoj-ruci": "B LINE",
  "/hr/rotorski-sakupljaci/toro-jedan-rotor": "TORO",
  "/hr/dvokotacni-grabljaci/toro-dvorotorski": "TORO",
  "/hr/fiksni-prijedlozi/moro-aus-fiksni": "MORO AUS",
  "/hr/hidraulicki-sklopivi-predsjedaci/moro-auh-hidraulicki-sklopivi": "MORO AUH",
  "/hr/kruzne-stepenice/bronca-fiksno": "BRONCA",
  "/hr/mini-bagri/suki": "SUKI",
  "/hr/mini-bagri/ward": "WARD",
  "/hr/mjesaci-hrane/vodoravne-mjesalice-hrane-hammer": "HAMMER",
  "/hr/mjesaci-hrane/vertikalne-mijesalice-hrane-hammer": "HAMMER",
  "/hr/mjesaci-hrane/zeta-fmv": "ZETA FMV",
  "/hr/mjesaci-hrane/zeta-fmv-2": "ZETA FMV",
  "/hr/mlinovi-za-zito/zitni-mlinovi-zonda": "ZONDA",
  "/hr/mlinovi-za-zito/mlini-za-zito-hammer": "HAMMER",
  "/hr/utezi-za-traktore/utezi": "",
  "/hr/drobilci-grana": "",
  "/hr/mehanicki-tanjuri": "",
  "/hr/transportne-trake": "",
  "/hr/plugi/nero": "NERO",
  "/hr/prikolice/jednoosovinske-prikolice-vita": "VITA",
  "/hr/prikolice/dvoosovinske-prikolice-vita": "VITA",
  "/hr/prikolice/tandem-prikolice-vita": "VITA",
  "/hr/prikolice/gradevinske-prikolice-vita": "VITA",
};

/**
 * Naša imenica kad ona iz kategorije nije dovoljno precizna. Prikolice VITA su
 * jedan program u pet izvedbi, pa izvedba mora u naziv — inače katalog nosi pet
 * redova „Traktorska prikolica VITA".
 */
const NAZIVI = {
  "/hr/prikolice/jednoosovinske-prikolice-vita": "Jednoosovinska traktorska prikolica",
  "/hr/prikolice/dvoosovinske-prikolice-vita": "Dvoosovinska traktorska prikolica",
  "/hr/prikolice/tandem-prikolice-vita": "Tandem traktorska prikolica",
  "/hr/prikolice/gradevinske-prikolice-vita": "Građevinska traktorska prikolica",
};

/** Dodatak uz oznaku kad se ista oznaka javlja u više izvedbi. */
const DODACI = {
  "/hr/rotorski-sakupljaci/toro-jedan-rotor": "jednorotorska",
  "/hr/dvokotacni-grabljaci/toro-dvorotorski": "dvorotorska",
  "/hr/mjesaci-hrane/vodoravne-mjesalice-hrane-hammer": "horizontalna",
  "/hr/mjesaci-hrane/vertikalne-mijesalice-hrane-hammer": "vertikalna",
  // Izvor drži dve strane iste oznake, sa različitim zapreminama u tabeli.
  "/hr/mjesaci-hrane/zeta-fmv": "manji model",
  "/hr/mjesaci-hrane/zeta-fmv-2": "veći model",
  "/hr/pomagala-i-prikljucci/mano-pv": "manji model",
  "/hr/pomagala-i-prikljucci/mano-pv-2": "veći model",
};

/* ------------------------------- Preuzimanje ------------------------------ */

const spavaj = (ms) => new Promise((r) => setTimeout(r, ms));

if (process.argv.includes("--osvezi")) rmSync(CACHE_DIR, { recursive: true, force: true });
mkdirSync(CACHE_DIR, { recursive: true });
mkdirSync(ORIGINALS_DIR, { recursive: true });

const kesFajl = (kljuc, ext) =>
  resolve(CACHE_DIR, `${createHash("sha1").update(kljuc).digest("hex").slice(0, 16)}${ext}`);

/** Keširano preuzimanje HTML-a — drugo pokretanje ne dira izvor. */
async function stranica(putanja) {
  const fajl = kesFajl(putanja, ".html");
  if (existsSync(fajl)) return readFileSync(fajl, "utf8");

  await spavaj(PAUZA_MS);
  const odgovor = await fetch(`${ORIGIN}${putanja}`, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "hr,sr;q=0.9" },
  });
  if (!odgovor.ok) throw new Error(`${odgovor.status}`);
  const html = await odgovor.text();
  writeFileSync(fajl, html, "utf8");
  return html;
}

/** Skida original fotografije; vraća putanju do fajla ili `null`. */
async function fotografija(izvorniPut, ime) {
  const ext = extname(izvorniPut).toLowerCase() || ".jpg";
  const cilj = resolve(ORIGINALS_DIR, `${ime}${ext}`);
  if (existsSync(cilj)) return cilj;

  await spavaj(PAUZA_MS);
  const odgovor = await fetch(`${ORIGIN}${izvorniPut}`, {
    headers: { "User-Agent": USER_AGENT, Referer: ORIGIN },
  });
  if (!odgovor.ok) return null;
  writeFileSync(cilj, Buffer.from(await odgovor.arrayBuffer()));
  return cilj;
}

/* -------------------------------- Parsiranje ------------------------------ */

/** Imenovani entiteti koje izvor stvarno koristi (`&scaron;` → „š"). */
const ENTITETI = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  scaron: "š", Scaron: "Š", ccaron: "č", Ccaron: "Č", cacute: "ć", Cacute: "Ć",
  zcaron: "ž", Zcaron: "Ž", dstrok: "đ", Dstrok: "Đ", eacute: "é", uuml: "ü", ouml: "ö", auml: "ä",
};

const bezOznaka = (s) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (celo, ime) => ENTITETI[ime] ?? celo)
    .replace(/\s+/g, " ")
    .trim();

/** Poslednji segment adrese. */
const segment = (putanja) => putanja.split("/").filter(Boolean).pop() ?? "";
/** Pretposlednji segment — kategorija iz koje mašina dolazi. */
const roditelj = (putanja) => {
  const delovi = putanja.split("/").filter(Boolean);
  return delovi[delovi.length - 2] ?? "";
};

/** Adrese iz mreže proizvoda na strani kategorije. */
function vezeIzMreze(html, jezik) {
  const pocetak = html.indexOf("grid-products-designer");
  if (pocetak < 0) return [];
  const kraj = html.indexOf("<footer", pocetak);
  const deo = html.slice(pocetak, kraj > 0 ? kraj : undefined);

  const nadjene = new Set();
  const uzorak = new RegExp(`href="(/${jezik}/[^"#?]+)"`, "g");
  for (const m of deo.matchAll(uzorak)) nadjene.add(m[1]);
  return [...nadjene];
}

/** Naslov strane — `h1` bez breadcrumb naslova („General"). */
function naslov(html) {
  const svi = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => bezOznaka(m[1]));
  return svi.filter((t) => t && t.toLowerCase() !== "general").pop() ?? "";
}

/**
 * Naslovna fotografija mašine. `designer_text_photo` je album koji izvor koristi
 * baš za portret proizvoda — i ujedno jedini pouzdan znak da je strana mašina, a
 * ne kategorija: kategorije nose `grid_products` sličice ili nijednu sliku.
 */
function naslovnaSlika(html) {
  return html.match(/src="(\/data\/albums\/designer_text_photo\/[^"]+)"/)?.[1] ?? null;
}

/** Sve fotografije iz galerije — bez sličica za navigaciju. */
function galerija(html) {
  const nadjene = new Set();
  for (const m of html.matchAll(/src="(\/data\/albums\/slider_gallery\/[^"]+)"/g)) {
    nadjene.add(m[1]);
  }
  return [...nadjene];
}

/* --------------------------------- Obilazak -------------------------------- */

/**
 * Silazak od svake kategorije iz `IZVOR` do stranica mašina. `podatak` se
 * nasleđuje naniže, pa podkategorija koja nije izričito nabrojana ne ispada iz
 * uvoza — dobije tip svog roditelja.
 */
async function obidji() {
  const red = Object.entries(IZVOR).map(([seg, podatak]) => ({
    putanja: `/${podatak.jezik ?? "hr"}/${seg}`,
    jezik: podatak.jezik ?? "hr",
    podatak,
  }));
  const videno = new Set(red.map((r) => r.putanja));
  const masine = [];

  while (red.length) {
    const { putanja, jezik, podatak } = red.shift();
    let html;
    try {
      html = await stranica(putanja);
    } catch (e) {
      console.warn(`\n  ! preskočeno ${putanja} — ${e.message}`);
      continue;
    }

    const moj = IZVOR[segment(putanja)] ?? podatak;

    for (const veza of vezeIzMreze(html, jezik)) {
      if (videno.has(veza)) continue;
      videno.add(veza);
      red.push({ putanja: veza, jezik, podatak: moj });
    }

    // Portret = stranica mašine. Kategorija ga nema, pa i kad ima mrežu i kad
    // je prazna, ovde ne upada.
    const slika = naslovnaSlika(html);
    if (!slika) continue;

    masine.push({
      putanja,
      grana: moj.grana,
      tip: moj.tip,
      naziv: NAZIVI[putanja] ?? moj.naziv,
      // Dodatak se čita iz kategorije iz koje je mašina STVARNO došla, ne iz
      // one od koje je obilazak krenuo — „REX" pod četiri pogona.
      dodatak: DODACI[putanja] ?? IZVOR[roditelj(putanja)]?.dodatak ?? moj.dodatak,
      oznaka: ISPRAVKE[putanja] ?? naslov(html),
      slika,
      galerija: galerija(html),
    });
    process.stdout.write(`\r  nađeno mašina: ${masine.length}   `);
  }

  console.log();
  return masine;
}

/* --------------------------- Tehnički podaci ------------------------------ */

/**
 * Tabela modela — ono što na izvoru stoji pored fotografije („Število nožev",
 * „Delovna širina"…). Nije lista naziv→vrednost nego MATRICA: redovi su
 * osobine, kolone su izvedbe iste mašine (TERA HP 210 / 240 / 280).
 *
 * ČITA SE SA SLOVENAČKE VERZIJE, iako sve ostalo dolazi sa hrvatske. Razlog je
 * prozaičan: na hrvatskim (i engleskim, i nemačkim) stranicama je tabela prazna
 * — `<tbody>` nema nijedan red ni u serverskom HTML-u ni posle izvršavanja
 * JavaScript-a. Popunjena je jedino slovenačka.
 *
 * Spona između dve verzije je PUTANJA NASLOVNE FOTOGRAFIJE
 * (`/data/albums/designer_text_photo/9-tera-1.webp`) — ista je na svim
 * jezicima, dok su slug-ovi prevedeni pa se ne poklapaju.
 */
function tabela(html) {
  // Isti podaci stoje dvaput: jednom za desktop, jednom za mobilni prikaz.
  // Uzima se samo desktop blok, inače bi svaki red bio udvojen.
  const pocetak = html.indexOf("table-children-desktop");
  if (pocetak < 0) return null;
  const kraj = html.indexOf("table-children-mobile", pocetak);
  const deo = html.slice(pocetak, kraj > 0 ? kraj : undefined);

  const redovi = [...deo.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((m) =>
      [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => bezOznaka(c[1])),
    )
    .filter((r) => r.length > 1 && r.some(Boolean));

  if (redovi.length < 2) return null;
  const [zaglavlje, ...ostatak] = redovi;
  return { kolone: zaglavlje.slice(1), redovi: ostatak };
}

/**
 * Obilazak slovenačke verzije, isti obrazac kao glavni — samo što se ovde ne
 * skupljaju mašine nego tabele, i to po naslovnoj fotografiji.
 */
async function tabeleSaSlovenackog() {
  // Mega-meni je na svakoj strani, pa jedan zahtev daje ceo spisak kategorija.
  const meni = await stranica("/si/kmetijska-mehanizacija");
  const seme = [...new Set([...meni.matchAll(/href="(\/si\/[^"#?]+)"/g)].map((m) => m[1]))];

  const red = seme.map((putanja) => ({ putanja }));
  const videno = new Set(seme);
  const poSlici = new Map();

  while (red.length) {
    const { putanja } = red.shift();
    let html;
    try {
      html = await stranica(putanja);
    } catch {
      continue; // strana koje nema na ovom jeziku — nije greška
    }

    for (const veza of vezeIzMreze(html, "si")) {
      if (videno.has(veza)) continue;
      videno.add(veza);
      red.push({ putanja: veza });
    }

    const slika = naslovnaSlika(html);
    if (!slika || poSlici.has(slika)) continue;
    const t = tabela(html);
    if (t) poSlici.set(slika, t);
    process.stdout.write(`\r  nađeno tabela: ${poSlici.size}   `);
  }

  console.log();
  return poSlici;
}

/* ------------------------ Prevod tehničkih podataka ----------------------- */

/**
 * Nazivi osobina sa slovenačkog na srpski.
 *
 * Slovenački jeste blizak, ali nije isti: „Število nožev" nije „Broj noževa",
 * „Zmogljivost" nije „Zmogljivost", a „KM" (konjska moč) bi se ovde pročitalo
 * kao kilometri. Ovo su redovi koje kupac čita, pa idu prevedeni.
 *
 * Prevodi su BEZ jedinice; nju skripta sama vraća iz izvornog naziva (vidi
 * `jedinicaIzNaziva`). Tako jedan prevod pokriva „Teža (kg)" i „Teža", a
 * jedinica se ne prepisuje ručno na sto mesta.
 *
 * Ključ je tekst sa izvora, malim slovima i bez viška razmaka. Ono što ovde ne
 * postoji prolazi NEPREVEDENO, a skripta ga na kraju ispiše — tako se nova
 * osobina odmah vidi umesto da tiho ostane na slovenačkom. Oznake sa skice
 * (A, B, C…) namerno nisu u tabeli: one se ne prevode.
 */
const OSOBINE = {
  "model": "Model",
  "število nožev": "Broj noževa",
  "število diskov": "Broj diskova",
  "delovna širina (m)": "Radna širina",
  "delovna širina (cm)": "Radna širina",
  "delovna širina": "Radna širina",
  "širina (cm)": "Ukupna širina",
  "širina (m)": "Ukupna širina",
  "širina (mm)": "Ukupna širina",
  "širina": "Ukupna širina",
  "skupna širina (cm)": "Ukupna širina",
  "dolžina": "Dužina",
  "dolžina (cm)": "Dužina",
  "dolžina (mm)": "Dužina",
  "višina": "Visina",
  "višina (cm)": "Visina",
  "višina (mm)": "Visina",
  "globina (mm)": "Dubina",
  "priporočena minimalna moč traktorja (kw/km)": "Preporučena snaga traktora",
  "priporočena minimalna moč traktorja(km)": "Preporučena snaga traktora",
  "priporočena minimalna moč traktorja": "Preporučena snaga traktora",
  "priporočena moč traktorja": "Preporučena snaga traktora",
  "potrebna moč traktorja (km)": "Potrebna snaga traktora",
  "potrebna moč traktorja": "Potrebna snaga traktora",
  "min. moč traktorja (km)": "Najmanja snaga traktora",
  "najmanjša potrebna moč traktorja (km/kw)": "Najmanja potrebna snaga traktora",
  "najmanjša potrebna moč motorja": "Najmanja potrebna snaga motora",
  "moč": "Snaga",
  "moč motorja": "Snaga motora",
  "moč motorja (kw)": "Snaga motora",
  "moč motorja (kw/km)": "Snaga motora",
  "moč motorja (kw/v)": "Snaga motora",
  "moč bencinskega motorja (km)": "Snaga benzinskog motora",
  "tip motorja": "Tip motora",
  "zagon": "Pokretanje",
  "menjalnik": "Menjač",
  "napetost (v)": "Napon",
  "teža (kg)": "Masa",
  "teža": "Masa",
  "masa": "Masa",
  "masa (kg)": "Masa",
  "lastna masa (kg)": "Sopstvena masa",
  "lastna teža (kg)": "Sopstvena masa",
  "skupna teža (kg)": "Ukupna masa",
  "delovna teža (kg)": "Radna masa",
  "največja skupna masa (kg)": "Najveća ukupna masa",
  "največja dovoljena teža (kg)": "Najveća dozvoljena masa",
  "največja obremenitev (kg)": "Najveće opterećenje",
  "nosilnost": "Nosivost",
  "nosilnost (kg)": "Nosivost",
  "zmogljivost (ha/h)": "Učinak",
  "zmogljivost (m3/h)": "Učinak",
  "zmogljivost": "Učinak",
  "delovna zmogljivost (t/h)": "Radni učinak",
  "storilnost (bal/dan)": "Učinak (bala na dan)",
  "kapaciteta": "Kapacitet",
  "kapaciteta (kg/l)": "Kapacitet",
  "kapaciteta (za glav živine)": "Kapacitet (grla stoke)",
  "vrtljaji kardanske gredi (vrt/min)": "Obrtaji kardana",
  "vrtljaji kardanske gredi": "Obrtaji kardana",
  "maks. število vrtljajev kardana (obr/min)": "Najveći obrtaji kardana",
  "hitrost priključne cevi (rpm)": "Obrtaji priključnog vratila",
  "število vrtljajev": "Broj obrtaja",
  "največji navor (nm)": "Najveći obrtni moment",
  "delovna hitrost": "Radna brzina",
  "delovna hitrost (km/h)": "Radna brzina",
  "maksimalna hitrost (km/h)": "Najveća brzina",
  "največja dovoljena hitrost (km/h)": "Najveća dozvoljena brzina",
  "prostornina": "Zapremina",
  "prostornina (m3)": "Zapremina",
  "prostornina zalogovnika (l)": "Zapremina rezervoara",
  "prostornina rezervoarja za gorivo (l)": "Zapremina rezervoara goriva",
  "prostornina rezervoarja": "Zapremina rezervoara",
  "zalogovnik (l)": "Rezervoar",
  "dimenzije zalogovnika (cm)": "Dimenzije rezervoara",
  "rezervoar olja (l)": "Rezervoar ulja",
  "količina olja (l)": "Količina ulja",
  "količina hidr. olja (l)": "Količina hidrauličnog ulja",
  "lasten zalogovnik olja": "Sopstveni rezervoar ulja",
  "maksimalni delovni tlak (bar)": "Najveći radni pritisak",
  "premer": "Prečnik",
  "največji premer": "Najveći prečnik",
  "min. premer (cm)": "Najmanji prečnik",
  "premer rotorja (mm)": "Prečnik rotora",
  "debelina rotorja (mm)": "Debljina rotora",
  "premer kolesa (mm)": "Prečnik točka",
  "premer valja (cm)": "Prečnik valjka",
  "premer vretena (mm)": "Prečnik vretena",
  "premer žaginega lista (mm)": "Prečnik lista testere",
  "premer posameznega valja (mm)": "Prečnik pojedinačnog valjka",
  "maksimalni premer rezanja (mm)": "Najveći prečnik rezanja",
  "maks. premer hloda (mm)": "Najveći prečnik trupca",
  "maksimalni premer bale (cm)": "Najveći prečnik bale",
  "zunanji premer odmične kosilnice (cm)": "Spoljni prečnik kosačice",
  "premer odpiranja grabeža (cm)": "Prečnik otvaranja klešta",
  "število jermenov": "Broj kaiševa",
  "število kladiv": "Broj čekića",
  "teža kladiv (kg)": "Masa čekića",
  "število špic": "Broj vrhova",
  "razdalja med špicami (cm)": "Razmak između vrhova",
  "število lopatic": "Broj lopatica",
  "število nosilcev": "Broj nosača",
  "število sekcij": "Broj sekcija",
  "število šob": "Broj dizni",
  "šobe": "Dizne",
  "število osnovnih nožev": "Broj osnovnih noževa",
  "število nožev na dodatnem disku": "Broj noževa na dodatnom disku",
  "dimenzije noža (mm)": "Dimenzije noža",
  "nož": "Nož",
  "število rezalnih valjev": "Broj reznih valjaka",
  "število rezalnih diskov": "Broj reznih diskova",
  "število rotorjev": "Broj rotora",
  "število vrtavk": "Broj rotora",
  "število vzmetnih prstov na vrtavko": "Broj opružnih prstiju po rotoru",
  "število dvojnih prstov na nosilcu": "Broj dvostrukih prstiju po nosaču",
  "št. dvojnih prstov na nosilcu": "Broj dvostrukih prstiju po nosaču",
  "št. nosilcev prstov na rotorju": "Broj nosača prstiju na rotoru",
  "pocinkani dvojni prsti": "Pocinkovani dvostruki prsti",
  "število rahljalnih nog": "Broj radnih tela",
  "število zob": "Broj radnih tela",
  "število lemežev": "Broj plužnih tela",
  "število brazd": "Broj brazdi",
  "vrsta desk": "Vrsta dasaka",
  "število vrst": "Broj redova",
  "razmik med vrstami": "Razmak između redova",
  "razmak med vrstami diskov (cm)": "Razmak između redova diskova",
  "št. vrst klinov": "Broj redova klinova",
  "število stopenj cilindra": "Broj stepeni cilindra",
  "globina": "Dubina",
  "delovna globina": "Radna dubina",
  "maksimalna globina kopanja": "Najveća dubina kopanja",
  "maksimalen doseg kopanja": "Najveći domet kopanja",
  "maks. naklon (°)": "Najveći nagib",
  "nagib (°)": "Nagib",
  "odmik od tal - sredina (mm)": "Klirens (sredina)",
  "kategorija": "Kategorija",
  "kategorija priklopa": "Kategorija priključka",
  "priklop": "Priključak",
  "priključek": "Priključak",
  "vrsta priklopa": "Vrsta priključka",
  "možnost priklopa": "Mogućnost priključivanja",
  "vpetje": "Prihvat",
  "pocinkan priklop": "Pocinkovan priključak",
  "vrtljiv priklop": "Obrtni priključak",
  "priklop za vlečno uho": "Priključak za vučnu ušicu",
  "gibljiv tritočkovni pristop": "Pokretni trotočkasti prihvat",
  "gibljiva ruda": "Pokretna ruda",
  "transportna kolesa": "Transportni točkovi",
  "transportna širina (cm)": "Transportna širina",
  "transportna višina (cm)": "Transportna visina",
  "višina v delovnem položaju (mm)": "Visina u radnom položaju",
  "v x š x d (transportni položaj) (mm)": "V × Š × D (transportni položaj)",
  "v (delovni položaj) (mm)": "V (radni položaj)",
  "š (delovni položaj, priklop bočno) (mm)": "Š (radni položaj, bočni priključak)",
  "dimenzije (d x š x v) (mm)": "Dimenzije (D × Š × V)",
  "skupna dimenzija prikolice (d x š x v) (mm)": "Ukupne dimenzije prikolice (D × Š × V)",
  "dimenzije okvirja": "Dimenzije rama",
  "višina okvirja (cm)": "Visina rama",
  "konstrukcija": "Konstrukcija",
  "način nastavljanja širine": "Način podešavanja širine",
  "pnevmatike": "Pneumatici",
  "širina koloteka (mm)": "Širina traga",
  "zavore": "Kočnice",
  "hidravlični pomik": "Hidraulični pomak",
  "hidravlični dvig": "Hidraulično podizanje",
  "hidravlični dvig vreten": "Hidraulično podizanje vretena",
  "hidravlični dvig izmetne cevi": "Hidraulično podizanje izbacne cevi",
  "hidravlično nastavljiva izmetna loputa": "Hidraulično podesiva izbacna zaklopka",
  "hidravlično vrtljiva cev (degrees)": "Hidraulično obrtna cev",
  "hidravlično samodejno dovajanje": "Hidraulično automatsko dovođenje",
  "serijsko hidravlično odpiranje vrat": "Serijsko hidraulično otvaranje vrata",
  "zasuk vreten navznoter": "Zakretanje vretena ka unutra",
  "mehanski premik preme": "Mehanički pomak preme",
  "štirikolesni pogon": "Pogon na četiri točka",
  "pogon": "Pogon",
  "upravljanje": "Upravljanje",
  "upravljanje z ročicami": "Upravljanje polugama",
  "krmiljenje garniture": "Upravljanje rampom",
  "dolžina iztegnjene teleskopske roke": "Dužina izvučene teleskopske ruke",
  "višina dviga (cm)": "Visina podizanja",
  "višina dviga (mm)": "Visina podizanja",
  "dvižna zmogljivost (t)": "Nosivost dizalice",
  "maksimalna kapaciteta dviga (kg)": "Najveći kapacitet podizanja",
  "največja višina odlaganja (cm)": "Najveća visina istovara",
  "največja višina prekucne žlice (cm)": "Najveća visina kipe",
  "širina prekucne žlice (cm)": "Širina kipe",
  "nakladalna žlica (l)": "Utovarna kašika",
  "nakladalna žlica z zapiralnimi zobmi (l)": "Utovarna kašika sa zubima",
  "paletne vilice (cm)": "Paletne viljuške",
  "vrtalni sveder (cm)": "Burgija",
  "nastavek": "Nastavak",
  "nastavljiva podporna noga": "Podesiva potporna noga",
  "gosenice (d x š) (cm)": "Gusenice (D × Š)",
  "širina gosenic (mm)": "Širina gusenica",
  "način kipanja": "Način kipovanja",
  "tristrano kipanje": "Trostrano kipovanje",
  "dimenzije kasona (cm)": "Dimenzije sanduka",
  "višina kasona od tal (cm)": "Visina sanduka od tla",
  "stranice (cm)": "Stranice",
  "višina stranic (mm)": "Visina stranica",
  "debelina tal (mm)": "Debljina poda",
  "debelina stene (mm)": "Debljina stranice",
  "debelina spodnje plošče (mm)": "Debljina donje ploče",
  "debelina spirale (mm)": "Debljina spirale",
  "notranje dimenzije nakladalne površine (mm)": "Unutrašnje dimenzije tovarnog prostora",
  "zunanje dimenzije nakladalne površine (mm)": "Spoljne dimenzije tovarnog prostora",
  "nakladalna prostornina (m3)": "Zapremina tovarnog prostora",
  "nakladalna dolžina (m)": "Dužina utovara",
  "izpust za žito": "Ispust za žito",
  "sila cepljenja (t)": "Sila cepanja",
  "cepilna sila (t)": "Sila cepanja",
  "cepilna višina (mm)": "Visina cepanja",
  "dolžina cepljenja": "Dužina cepanja",
  "maks. dolžina cepljenja (mm)": "Najveća dužina cepanja",
  "maks. dolžina cepljenca (mm)": "Najveća dužina cepanice",
  "maks. dolžina drv (cm)": "Najveća dužina drva",
  "hitrost cepljenja h1/h2/ph (cm/s)": "Brzina cepanja H1/H2/PH",
  "dimenzija traku za drva (mm)": "Dimenzije trake za drva",
  "dolžina transportnega traku (m)": "Dužina transportne trake",
  "notranja širina transportnega traku (mm)": "Unutrašnja širina transportne trake",
  "maks. odprtje klešč (cm)": "Najveći otvor klešta",
  "vrtenje klešč (°)": "Obrtanje klešta",
  "sila zapiranja klešč (bar)": "Sila zatvaranja klešta",
  "velikost drobljenja (mm)": "Veličina ivera",
  "velikost odprtine (cm)": "Veličina otvora",
  "izmet (°)": "Ugao izbacivanja",
  "obračanje": "Obrtanje",
  "velikost bal (cm)": "Veličina bale",
  "teža bal (kg)": "Masa bale",
  "nastavitve dolžine bal (cm)": "Podešavanje dužine bale",
  "pobiralna širina (cm)": "Širina pokupljanja",
  "širina zgrabka (m)": "Širina otkosa",
  "enostavna nastavitev širine zgrabka": "Jednostavno podešavanje širine otkosa",
  "zložljiva zgrabljalna zavesa": "Sklopiva zavesa",
  "širina folije (cm)": "Širina folije",
  "višina košnje (mm)": "Visina košenja",
  "tip garniture": "Tip rampe",
  "delovna širina garniture (m)": "Radna širina rampe",
  "nastavitev višine garniture": "Podešavanje visine rampe",
  "samonivelacija": "Samonivelacija",
  "posoda za mešanje škropiva": "Posuda za mešanje",
  "pretok črpalke (l/min)": "Protok pumpe",
  "regulator": "Regulator",
  "regulatorji": "Regulatori",
  "širina raztrosa (m)": "Širina rasipanja",
  "čas priprave polne kapacitete (min)": "Vreme punjenja punog kapaciteta",
  "reduktor na zunanji strani mulčerja": "Reduktor sa spoljne strane malčera",
};

/** Vrednosti su brojke sa jedinicom; prevode se samo ove cele reči. */
const VREDNOSTI = {
  da: "Da",
  ne: "Ne",
  opcija: "Opciono",
  opcijsko: "Opciono",
  "opcijsko/dodatna oprema": "Opciono",
  standard: "Standardno",
  serijsko: "Serijski",
  brez: "Bez",
  mehansko: "Mehanički",
  hidravlično: "Hidraulično",
  ročno: "Ručno",
};

/**
 * Popravke jedinica unutar vrednosti.
 *
 * „KM" je slovenačka skraćenica za konjsku snagu; na srpskom je to KS, a „55 KM"
 * bi se pročitalo kao 55 kilometara — najgora moguća greška u tabeli snage.
 * `km/h` se ne dira, otuda granica reči i velika slova.
 */
const JEDINICE = [
  [/\bKM\b/g, "KS"],
  [/\(?\bvrt\/min\)?/g, "o/min"],
  [/\(?\bobr\/min\)?/g, "o/min"],
  [/\bU\/min\b/g, "o/min"],
  [/\bkos\b/gi, "kom"],
];

/**
 * Popravke unutar vrednosti — sve što nije gola brojka sa jedinicom.
 *
 * Izvorne vrednosti su prošle kroz njihov automatski prevodilac, pa u njima
 * ima i pravih slovenačkih reči i grešaka mašinskog prevoda: „CAT I"
 * (kategorija priključka) je negde postalo „MAČKA I", jer je prevodilac
 * pročitao mačku. Redosled u listi je bitan — ide od najuže do najšire zamene.
 */
const POPRAVKE = [
  // Kategorija trotočkovnog priključka: izvor piše CAT, KAT i (prevedeno) MAČKA.
  // Na sajtu stoji jedan oblik, onaj međunarodni.
  [/\bMAČKA\b/gi, "CAT"],
  [/\bKAT\b/g, "CAT"],
  // Slovenački pravopis → srpski. Dva pravila umesto jednog neosetljivog na
  // veličinu slova, da „Hidravlične" ne postane „hidraulične" na početku reda.
  [/Hidravli/g, "Hidrauli"],
  [/hidravli/g, "hidrauli"],
  [/\bzavore\b/gi, "kočnice"],
  [/\bzavora\b/gi, "kočnica"],
  [/\bročna\b/gi, "ručna"],
  [/\bročno\b/gi, "ručno"],
  [/\bzračne\b/gi, "vazdušne"],
  [/\bmehansko\b/gi, "mehanički"],
  [/\bmehanski\b/gi, "mehanički"],
  [/\bkombiniran\b/gi, "kombinovan"],
  [/\bvrteči\b/gi, "obrtni"],
  [/\bperesaste\b/gi, "perasti"],
  [/\bpolne\b/gi, "puni"],
  [/\bosemdeset\b/gi, "80"],
  [/\b3 točkovni\b/gi, "trotočkasti"],
  [/\b3-strano\b/gi, "trostrano"],
  [/\bEl\.motor\b/g, "El. motor"],
];

/**
 * Jedinice koje smeju da ostanu u nazivu reda.
 *
 * ZAŠTO UOPŠTE: izvor je nedosledan. Kod jednih tabela jedinica stoji u
 * vrednosti („Teža (kg)" → „535 kg"), kod drugih SAMO u nazivu („Višina (cm)"
 * → „76"). Ako se jedinica izbaci iz naziva, druga vrsta tabela ostane bez
 * nje — „Masa 202" i „Radna širina 100" ne znače ništa.
 *
 * Zato jedinica ostaje UZ NAZIV (kao i na izvornom sajtu), a iz vrednosti se
 * skida kad je duplira — tako u koloni stoji gola brojka i kolona se čita kao
 * kolona, a ne kao spisak.
 *
 * Lista je zatvorena namerno: zagrada u nazivu nije uvek jedinica („(za glav
 * živine)", „(D x Š x V)", „(sredina)") i takva mora da ostane deo naziva.
 */
const JEDINICE_NAZIVA = {
  kg: "kg",
  cm: "cm",
  mm: "mm",
  m: "m",
  m3: "m³",
  l: "l",
  t: "t",
  min: "min",
  bar: "bar",
  Nm: "Nm",
  V: "V",
  kW: "kW",
  "°": "°",
  degrees: "°",
  "ha/h": "ha/h",
  "km/h": "km/h",
  "t/h": "t/h",
  "m3/h": "m³/h",
  "cm/s": "cm/s",
  "l/min": "l/min",
  "kg/l": "kg/l",
  rpm: "o/min",
  "vrt/min": "o/min",
  "obr/min": "o/min",
};

/** Jedinica sa kraja naziva („Teža (kg)" → „kg"); `null` kad zagrada nije jedinica. */
function jedinicaIzNaziva(tekst) {
  const u = tekst.match(/\(([^)]{1,10})\)\s*$/)?.[1]?.trim();
  return u && JEDINICE_NAZIVA[u] ? u : null;
}

/** Skida jedinicu sa kraja vrednosti kad je naziv već nosi („535 kg" → „535"). */
function bezJedinice(vrednost, jedinica) {
  if (!jedinica) return vrednost;
  const uzorak = jedinica.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const skraceno = vrednost
    .replace(new RegExp(String.raw`\s*\(?${uzorak}\)?\s*$`, "i"), "")
    .trim();
  // Ako od vrednosti ostane samo jedinica („kg"), bolje je ne dirati je.
  return skraceno || vrednost;
}

const nepoznateOsobine = new Set();

function prevediOsobinu(tekst, jedinica) {
  const kljuc = tekst.toLowerCase().replace(/\s+/g, " ").trim();
  const nadjeno = OSOBINE[kljuc];
  if (!nadjeno) {
    if (kljuc) nepoznateOsobine.add(tekst);
    return tekst;
  }
  // Prevod koji već nosi zagradu („Dimenzije (D × Š × V)") je potpun.
  if (nadjeno.includes("(")) return nadjeno;
  return jedinica ? `${nadjeno} (${JEDINICE_NAZIVA[jedinica]})` : nadjeno;
}

/**
 * Da li vrednost i posle čišćenja nosi svoju jedinicu („3,8 m").
 *
 * Traži se BROJ pa jedinica, da se „Da", „Ne" i „CAT I" ne bi računali kao
 * jedinica — inače bi svaki tekstualni red ostao bez oznake u nazivu.
 */
const nosiJedinicu = (v) => /\d\s*[\p{L}°³²]+(\/[\p{L}]+)?$/u.test(v);

function prevediVrednost(tekst) {
  // „Besedilo:" je slovenački za „tekst" — ostatak iz izvorovog CMS-a koji je
  // procurio u podatak, a ne sam podatak.
  let v = tekst.replace(/^\s*Besedilo\s*:\s*/i, "").trim();
  // Prazna vrednost („/") neka ostane prazna — tabela je crta sama kao „—".
  if (v === "/" || v === "-") return "";

  const cela = VREDNOSTI[v.toLowerCase()];
  if (cela) return cela;

  v = POPRAVKE.reduce((t, [uzorak, zamena]) => t.replace(uzorak, zamena), v);
  return JEDINICE.reduce((t, [uzorak, zamena]) => t.replace(uzorak, zamena), v).trim();
}

/** Tabela sa izvora → tabela za sajt, sa prevedenim nazivima redova. */
function prevediTabelu(t) {
  return {
    kolone: t.kolone,
    redovi: t.redovi
      .map(([naziv, ...vrednosti]) => {
        const jedinica = jedinicaIzNaziva(naziv);
        const ociscene = vrednosti.map((v) => bezJedinice(prevediVrednost(v), jedinica));
        // Izvor ume da protivreči sam sebi: „Širina (cm)" sa vrednostima
        // „3,8 m". Vrednost je merodavna, pa u tom slučaju jedinica iz naziva
        // ispada — bolje da naziv ćuti nego da tabela tvrdi dve stvari.
        const drugaJedinica = ociscene.some(nosiJedinicu);
        return [
          prevediOsobinu(naziv, drugaJedinica ? null : jedinica),
          ...ociscene,
        ];
      })
      // Red „Model" je već zaglavlje tabele — ne ponavlja se u telu.
      .filter(([naziv]) => naziv.toLowerCase() !== "model"),
  };
}

/* --------------------------------- Sastavi -------------------------------- */

/** Naziv za katalog: „Kosačica JASA", „Cepač drva REX (električni pogon)". */
function punNaziv(m) {
  const osnova = [m.naziv, m.oznaka].filter(Boolean).join(" ").trim();
  return m.dodatak ? `${osnova} (${m.dodatak})` : osnova;
}

/** „Malčer G LINE" → „malcer-g-line" — za ime fajla fotografije. */
const uSlug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

console.log("Obilazak hofman.at …");
let masine = await obidji();

// Iste mašine ume da se pojavi i na kategoriji i na svojoj strani
// (`/hr/arga` i `/hr/arga/arga`) — isti portret ih odaje. Ostaje dublja adresa.
const poSlici = new Map();
for (const m of [...masine].sort((a, b) => b.putanja.length - a.putanja.length)) {
  if (!poSlici.has(m.slika)) poSlici.set(m.slika, m);
}
masine = [...poSlici.values()];

console.log("");
console.log("Tehnički podaci (slovenačka verzija) …");
const tabele = await tabeleSaSlovenackog();
let bezTabele = 0;
for (const m of masine) {
  const t = tabele.get(m.slika);
  if (t) m.tabela = prevediTabelu(t);
  else bezTabele += 1;
}
console.log(
  `  mašina sa tabelom: ${masine.length - bezTabele} od ${masine.length}`,
);
if (nepoznateOsobine.size) {
  console.log(
    `  NEPREVEDENE osobine (dopuni OSOBINE u ovoj skripti): ${[...nepoznateOsobine].join(" | ")}`,
  );
}

// Stabilan redosled → stabilni kataloški brojevi između pokretanja.
const redGrana = Object.keys(GRANE);
masine.sort(
  (a, b) =>
    redGrana.indexOf(a.grana) - redGrana.indexOf(b.grana) ||
    a.tip.localeCompare(b.tip) ||
    a.putanja.localeCompare(b.putanja),
);

const poTipu = new Map();
for (const m of masine) {
  const kljuc = `${m.grana}/${m.tip}`;
  poTipu.set(kljuc, (poTipu.get(kljuc) ?? 0) + 1);
}

console.log(`\nMašina za uvoz: ${masine.length}\n`);
for (const [kljuc, broj] of [...poTipu].sort()) console.log(`  ${kljuc.padEnd(38)} ${broj}`);

if (process.argv.includes("--stablo")) {
  const put = resolve(CACHE_DIR, "stablo.json");
  writeFileSync(put, JSON.stringify(masine.map((m) => ({ ...m, punNaziv: punNaziv(m) })), null, 2), "utf8");
  console.log(`\nStablo upisano u ${put} — ništa nije promenjeno u src/data.`);
  process.exit(0);
}

/* --------------------------------- Upis ----------------------------------- */

console.log("\nSkidanje fotografija …");
const redovi = [];
const slikeMapa = {};
let id = ID_OD;

for (const m of masine) {
  const naziv = punNaziv(m);
  const slug = uSlug(naziv);
  const kljuc = String(id++);

  // Slika se u mapi imenuje po SLUG-u, a ne po kataloškom broju: broj se dodeljuje
  // redom, pa bi dodavanje jedne mašine pomerilo sve iza nje i pomešalo slike sa
  // proizvodima. Slug je vezan za sam naziv i ne pomera se.
  const original = await fotografija(m.slika, slug);
  if (original) slikeMapa[kljuc] = `/images/masine/hofman/${slug}.jpg`;

  redovi.push({
    id: kljuc,
    name: naziv,
    group: "masine-hofman",
    grana: m.grana,
    subgroup: m.tip,
    tagline: "",
    brand: "hofman",
    izvor: m.putanja,
    slug,
    // Tabela modela; izostaje kad je izvor nema (vidi `tabeleSaSlovenackog`).
    ...(m.tabela ? { tabela: m.tabela } : {}),
  });
  process.stdout.write(`\r  ${redovi.length}/${masine.length}   `);
}
console.log();

// Postojeće Rolland mašine ostaju netaknute — samo dobijaju granu.
const postojece = JSON.parse(readFileSync(MACHINES_FILE, "utf8")).filter(
  (r) => r.brand !== "hofman",
);
for (const r of postojece) r.grana ??= "poljoprivredne";

writeFileSync(MACHINES_FILE, `${JSON.stringify([...postojece, ...redovi], null, 2)}\n`, "utf8");
writeFileSync(GROUPS_FILE, `${JSON.stringify(GRANE, null, 2)}\n`, "utf8");

// Dvanaest ručno pripremljenih Rolland slika (`/images/masine/*.jpg`) ostaje —
// dopunjuju se, ne gaze.
const slikePostojece = Object.fromEntries(
  Object.entries(JSON.parse(readFileSync(IMAGES_FILE, "utf8"))).filter(
    ([, put]) => !String(put).startsWith("/images/masine/hofman/"),
  ),
);
writeFileSync(
  IMAGES_FILE,
  `${JSON.stringify({ ...slikePostojece, ...slikeMapa }, null, 2)}\n`,
  "utf8",
);

console.log(`\nUpisano: ${redovi.length} Hofman mašina + ${postojece.length} postojećih`);
console.log(`  ${MACHINES_FILE}`);
console.log(`  ${GROUPS_FILE}`);
console.log(`  ${IMAGES_FILE}`);
console.log(`\nSledeći korak: npm run masine:slike  (kadriranje fotografija za sajt)`);
