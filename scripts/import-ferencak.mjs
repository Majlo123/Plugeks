/**
 * Uvozi rezervne delove sa psc-ferencak.hr u naš katalog delova.
 *
 *   node scripts/import-ferencak.mjs [--dry]     (ili: npm run ferencak)
 *
 * Posle toga, redom:
 *   npm run slike:kadar -- ferencak      → slike za sajt (i skidanje žiga)
 *   npm run catalog                      → spajanje sa Rolland delovima u parts.json
 *
 * IZVOR: pet kategorija odeljka „Obrada zemlje" (vidi `KATEGORIJE`) — roto
 * drljače, drljače, freze, sjetvospremači i tanjurače. Svaka nosi ono što se na
 * toj mašini troši, sa tehničkim crtežima (dimenzije na samoj slici) i markom
 * mašine u naslovu. Spisak se čita iz mreže proizvoda kategorije; strana prima
 * `?s=` (koliko po strani), pa ceo spisak stane u jedan zahtev, a za svaki
 * slučaj se prolaze i ostale strane dok ima novih.
 *
 * ŠTA RADI:
 *  1. sa mreže čita naziv, njihov id i šifru, potkategoriju i putanju slike
 *  2. naziv (velika slova, hrvatski, skraćenice) prevodi u naš oblik:
 *     „NOŽ ROTO DRLJAČE LEMKEN D. 320x110x72x15 fi17" →
 *     „Nož roto drljače Lemken 320x110x72x15 fi 17 (desno)"
 *  3. iz naziva vadi TIP (za filter), MARKU mašine i STRANU ugradnje
 *  4. skida veliku sliku u `data/ferencak-originals/{kategorija}/{naš id}.webp`
 *  5. upisuje `src/data/ferencak.json` (redovi u istom obliku koji pravi
 *     build-catalog.mjs za Rolland delove) i `src/data/images.json`
 *
 * KATALOŠKI BROJEVI su naši, od 6001 naviše (Rolland staje na 4790, Hofman
 * mašine su 5001–5999, prikolice od 9001). Broj se veže za NJIHOV id proizvoda
 * i čuva u `ferencak.json`, pa ponovno pokretanje ne pomera postojeće —
 * novi komad dobija sledeći slobodan broj, a nestali se briše.
 *
 * ŠTA NAMERNO NE PRENOSI: cene (PlugekS radi po upitu; njihov iznos u evrima
 * ostaje samo kao podatak `izvor.cena` u JSON-u, nigde na sajtu) i opis —
 * izvor ga i nema, naziv je ceo opis. Komad bez fotografije na izvoru (njihov
 * `nopic.png`) ostaje bez slike, pa kartica pokazuje brendiran placeholder.
 *
 * ŽIG: na nekoliko crteža izvor ima poluprovidan logo preko sredine. Skida ga
 * `scripts/normalize_product_images.py` (posao `ferencak`), ne ova skripta.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGINALS_DIR = resolve(root, "data/ferencak-originals");
const OUT_FILE = resolve(root, "src/data/ferencak.json");
const IMAGES_FILE = resolve(root, "src/data/images.json");

const ORIGIN = "https://www.psc-ferencak.hr";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const DRY = process.argv.includes("--dry");

/** Prvi naš kataloški broj za delove sa ovog izvora. */
const ID_OD = 6001;

/** Pauza između zahteva — mali sajt, ne gura se. */
const PAUZA_MS = 300;
const spavaj = (ms) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------------- Tipovi -------------------------------- */

/**
 * Tip dela se prepoznaje po početku naziva. `naziv` je početak NAŠEG naziva
 * proizvoda, a `label` je ime tipa u FILTERU — obično isto, ali ne uvek:
 * noževi i klinovi roto drljače su isti potrošni deo pod dva imena, pa u
 * filteru stoje kao jedna stavka, a kartica i dalje kaže koji je od ta dva.
 *
 * `reci` su izuzeci od zajedničkog rečnika (`RECI`) samo za taj tip — skoro
 * uvek rod: ista skraćenica „ZAKR." uz nožić je „zakrivljeni", a uz S-oprugu
 * „zakrivljena".
 */
const TIPOVI = {
  rotodrljace: [
    {
      uzorak: /^NOŽ ROTO DRLJ(?:AČE|\.)\s*/i,
      key: "noz-roto-drljace",
      label: "Nož i klin roto drljače",
      naziv: "Nož roto drljače",
    },
    {
      uzorak: /^KLIN ROTO DRLJAČE\s*/i,
      key: "noz-roto-drljace",
      label: "Nož i klin roto drljače",
      naziv: "Klin roto drljače",
    },
    { uzorak: /^ČISTAČ VALJKA\s*/i, key: "cistac-valjka", label: "Čistač valjka roto drljače" },
    // Izvor piše i „KUČIŠTE" (Č umesto Ć) — prihvata se oboje.
    { uzorak: /^KU[ĆČ]IŠTE LEŽAJA(?: RD)?\s*/i, key: "kuciste-lezaja", label: "Kućište ležaja roto drljače" },
    { uzorak: /^LEŽAJ\s+(.*?)\s*ROTO DRLJAČE\s*/i, key: "lezaj-roto-drljace", label: "Ležaj roto drljače" },
    { uzorak: /^ZAŠTITA NOŽA(?: RD)?\s*/i, key: "zastita-noza", label: "Zaštita noža roto drljače" },
    { uzorak: /^BOLCNA\s*/i, key: "osovinica", label: "Osovinica roto drljače" },
  ],

  // „Brana" je hrvatski naziv za drljaču, pa „KLIN BRANE" = klin drljače.
  drljace: [
    {
      uzorak: /^KLIN\s*(?:-\s*)?(?:BRANE\s+)?/i,
      key: "klin-drljace",
      label: "Klin drljače",
      reci: { POVINUTI: "savijeni", ZAKRIVLJENI: "zakrivljeni", RAVNI: "ravni" },
    },
  ],

  freze: [
    { uzorak: /^NOŽ FREZE\s*/i, key: "noz-freze", label: "Nož freze" },
    {
      uzorak: /^VIJAK NOŽA\s*/i,
      key: "zavrtanj",
      label: "Zavrtanj i matica",
      naziv: "Zavrtanj noža freze",
    },
  ],

  setvospremaci: [
    { uzorak: /^DRŽAČ S[- ]OPRUGE\s*/i, key: "drzac-s-opruge", label: "Držač S-opruge" },
    // Jedini držač koji nije za S-oprugu — ide u isti tip kao držač noža
    // kosačice iz Rolland kataloga, da filter nema dva imena za istu stvar.
    {
      uzorak: /^NOSAČ NOŽA KULT\.?\s*/i,
      key: "drzac-noza",
      label: "Držač noža",
      naziv: "Nosač noža kultivatora",
    },
    {
      uzorak: /^NOŽIĆ S[- ](?:PERA|OPRUGE)\s*/i,
      key: "nozic-s-opruge",
      label: "Nožić S-opruge",
      reci: { POVINUTA: "savijeni", ZAKRIVLJENA: "zakrivljeni", ZAKR: "zakrivljeni" },
    },
    {
      uzorak: /^POJAČANJE PONIŠTIVAČA TRAGOVA\s*/i,
      key: "pojacanje-s-opruge",
      label: "Pojačanje S-opruge",
      naziv: "Pojačanje poništavača tragova",
    },
    { uzorak: /^POJAČANJE S[- ]OPRUGE\s*/i, key: "pojacanje-s-opruge", label: "Pojačanje S-opruge" },
    { uzorak: /^PONIŠTIVAČ TRAGOVA\s*/i, key: "ponistivac-tragova", label: "Poništavač tragova" },
    { uzorak: /^S[- ](?:OPRUGA|PERO)\s*/i, key: "s-opruga", label: "S-opruga", reci: { MALO: "mala" } },
    { uzorak: /^VIJAK\s*/i, key: "zavrtanj", label: "Zavrtanj i matica", naziv: "Zavrtanj" },
  ],

  tanjirace: [
    // Ne spaja se sa Rolland tipom „Tanjir (disk)" — to je tanjirasto crtalo
    // pluga, a ovo je disk tanjirače od pola metra naviše.
    {
      uzorak: /^DISK NAZUBLJENI\s*/i,
      key: "disk-tanjirace",
      label: "Disk tanjirače",
      naziv: "Disk tanjirače nazubljeni",
    },
    { uzorak: /^LEŽAJ(?:\s+TANJURAČE)?\s*/i, key: "lezaj-tanjirace", label: "Ležaj tanjirače" },
    { uzorak: /^ODSTOJNIK LEŽAJA\s*/i, key: "odstojnik", label: "Odstojnik", naziv: "Odstojnik ležaja" },
    { uzorak: /^ODSTOJNIK TANJURA\s*/i, key: "odstojnik", label: "Odstojnik", naziv: "Odstojnik tanjira" },
    { uzorak: /^OSOVINA TANJURAČE\s*/i, key: "osovina-tanjirace", label: "Osovina tanjirače" },
    // „Protu ploča" je kod njih druga reč za istu prirubnicu (vidi ime njihove
    // slike: `prirubnica-vanjska-fi-25`).
    {
      uzorak: /^(?:PRIRUBNICA|PROTU PLOČA)\s*/i,
      key: "prirubnica",
      label: "Prirubnica",
      reci: { VANJSKA: "spoljna", NUTARNJA: "unutrašnja" },
    },
    { uzorak: /^STRUGAČ (?:TANJURAČE|DISKOVA)\s*-?\s*/i, key: "strugac-tanjirace", label: "Strugač tanjirače" },
    { uzorak: /^MATICA\s*/i, key: "zavrtanj", label: "Zavrtanj i matica", naziv: "Matica" },
  ],
};

/* --------------------------------- Kategorije ------------------------------ */

/**
 * Kategorije izvora koje uvozimo. `slug` je i ime foldera sa slikama
 * (`data/ferencak-originals/{slug}` → `public/images/{slug}`), pa se ne menja
 * kad je jednom pušten — adrese slika su indeksirane.
 *
 * `grupa` je naša podela „delovi za koju mašinu" (faseta u katalogu); tanjirače
 * nastavljaju grupu koju je Rolland katalog već otvorio.
 *
 * `pre` su ispravke zapisa SAMO za tu kategoriju, pre deljenja naziva na reči.
 */
const KATEGORIJE = [
  {
    slug: "rotodrljace",
    putanja: "/rotodrljace/5/",
    grupa: { key: "delovi-roto-drljace", label: "Delovi za roto drljače" },
    tipovi: TIPOVI.rotodrljace,
  },
  {
    slug: "drljace",
    putanja: "/drljace-577/577/",
    grupa: { key: "delovi-drljace", label: "Delovi za drljače" },
    tipovi: TIPOVI.drljace,
  },
  {
    slug: "freze",
    putanja: "/freze-44/44/",
    grupa: { key: "delovi-freze", label: "Delovi za freze" },
    tipovi: TIPOVI.freze,
  },
  {
    slug: "setvospremaci",
    putanja: "/sjetvospremaci/9/",
    grupa: { key: "delovi-setvospremaci", label: "Delovi za setvospremače" },
    tipovi: TIPOVI.setvospremaci,
  },
  {
    slug: "tanjirace",
    putanja: "/tanjurace-7/7/",
    grupa: { key: "delovi-tanjirace", label: "Delovi za tanjirače" },
    tipovi: TIPOVI.tanjirace,
    // „OSOVINA TANJURAČE 28 D X 25" — 28 D je broj diskova, a ne desna strana;
    // „L 160" je dužina, a ne leva strana (drugde uz „L" broj ne ide).
    pre: [
      [/(\d+)\s*D\s*[xX]\s*(\d+)/g, "$1 diskova $2"],
      [/(\d+)\s*D\s+(?=FI\b)/gi, "$1 diskova "],
      [/\bL\s+(\d)/g, "L-$1"],
    ],
  },
];

/* ---------------------------------- Rečnik --------------------------------- */

/**
 * Marke mašina. Ključ i naziv za FILTER su isti kao u Rolland rečniku kad ista
 * marka već postoji (Lemken, Kuhn, Kverneland, Maschio, Brix, Kongskilde…) —
 * jedna marka, jedan unos u filteru bez obzira iz kog izvora deo dolazi. `ime`
 * je kako se marka piše u nazivu proizvoda: „Kuhn", a ne „Kuhn / Huard"
 * (Huard su plugovi).
 *
 * Tačka na kraju skraćenice se pri traženju skida („KVERN." i „KVERN" su isto).
 */
const MARKE = {
  AGRIA: { key: "agria", label: "Agria" },
  AGRIC: { key: "agric", label: "Agric" },
  AGROMET: { key: "agromet", label: "Agromet" },
  AMAZONE: { key: "amazone", label: "Amazone" },
  ALPEGO: { key: "alpego", label: "Alpego" },
  ARTERA: { key: "artera", label: "Artera" },
  BATUJE: { key: "batuje", label: "Batuje" },
  BEFA: { key: "befa", label: "Befa" },
  BERTOLINI: { key: "bertolini", label: "Bertolini" },
  BREVIGLIERI: { key: "breviglieri", label: "Breviglieri" },
  BREVIGL: { key: "breviglieri", label: "Breviglieri" },
  BREVI: { key: "breviglieri", label: "Breviglieri" },
  BRIX: { key: "brix", label: "Brix" },
  CALDERONI: { key: "calderoni", label: "Calderoni" },
  CARRARO: { key: "carraro", label: "Carraro" },
  CELLI: { key: "celli", label: "Celli" },
  DALBO: { key: "dalbo", label: "Dalbo" },
  DRAVA: { key: "drava", label: "Drava" },
  EBERHARDT: { key: "eberhardt", label: "Eberhardt" },
  EUROMA: { key: "euroma", label: "Euroma" },
  EURO: { key: "euroma", label: "Euroma" },
  FERABOLI: { key: "feraboli", label: "Feraboli" },
  FORIGO: { key: "forigo", label: "Forigo" },
  FRANDENT: { key: "frandent", label: "Frandent" },
  GRAMIP: { key: "gramip", label: "Gramip" },
  HORSCH: { key: "horsch", label: "Horsch" },
  HOWARD: { key: "howard", label: "Howard" },
  HOW: { key: "howard", label: "Howard" },
  IMT: { key: "imt", label: "IMT" },
  KONGSKILDE: { key: "kongskilde", label: "Kongskilde" },
  KONSKILDE: { key: "kongskilde", label: "Kongskilde" },
  KRONE: { key: "krone", label: "Krone" },
  KUHN: { key: "kuhn-huard", label: "Kuhn / Huard", ime: "Kuhn" },
  KVERNELAND: { key: "kverneland", label: "Kverneland" },
  KVERN: { key: "kverneland", label: "Kverneland" },
  KVER: { key: "kverneland", label: "Kverneland" },
  LANDSBERG: { key: "landsberg-pottinger", label: "Landsberg / Pöttinger", ime: "Landsberg" },
  LELY: { key: "lely", label: "Lely" },
  LELLY: { key: "lely", label: "Lely" },
  LEMIND: { key: "lemind", label: "Lemind (Leskovačka)", ime: "Lemind" },
  // Narodno ime za istu mašinu — leskovačka tanjirača je Lemind iz Leskovca.
  LESKOVAČKA: { key: "lemind", label: "Lemind (Leskovačka)", ime: "Leskovačka" },
  LEMKEN: { key: "lemken", label: "Lemken" },
  MALETTI: { key: "maletti", label: "Maletti" },
  MASCHIO: { key: "maschio", label: "Maschio" },
  MASCH: { key: "maschio", label: "Maschio" },
  MASHIO: { key: "maschio", label: "Maschio" },
  MIO: { key: "mio", label: "Mio" },
  MORRA: { key: "morra", label: "Morra" },
  MURATORI: { key: "muratori", label: "Muratori" },
  NARDI: { key: "nardi", label: "Nardi" },
  NIEMEYER: { key: "niemeyer", label: "Niemeyer" },
  OLT: { key: "olt", label: "OLT" },
  PEGORARO: { key: "pegoraro", label: "Pegoraro" },
  PERUGINI: { key: "perugini", label: "Perugini" },
  PERUG: { key: "perugini", label: "Perugini" },
  POTTINGER: { key: "landsberg-pottinger", label: "Landsberg / Pöttinger", ime: "Pöttinger" },
  RABE: { key: "rabe-werk", label: "Rabewerk", ime: "Rabe" },
  RAU: { key: "rau", label: "Rau" },
  REMAC: { key: "remac", label: "Remac" },
  ROTOITAL: { key: "rotoitalia", label: "Rotoitalia" },
  SEIMA: { key: "seima", label: "Seima" },
  SICMA: { key: "sicma", label: "Sicma" },
  SIP: { key: "sip", label: "SIP" },
  SLAM: { key: "slam", label: "Slam" },
  "V&N": { key: "vogel-noot", label: "Vogel & Noot" },
  VICON: { key: "vicon", label: "Vicon" },
  VIGOLO: { key: "vigolo", label: "Vigolo" },
};

/** Marka po tokenu iz naslova — bez tačke na kraju skraćenice. */
const nadjiMarku = (token) => MARKE[token.toUpperCase().replace(/\.$/, "")];

/** Oznaka strane ugradnje u naslovu → naš ključ. */
const STRANE = {
  "D.": "desni",
  D: "desni",
  DESNI: "desni",
  DESNA: "desni",
  "L.": "levi",
  L: "levi",
  LIJEVI: "levi",
  LIJEVA: "levi",
};
const SUFIKS_STRANE = { levi: "levo", desni: "desno" };

/**
 * Reči iz naslova koje NISU mere — prevode se i ostaju u nazivu. Sve ostalo
 * (brojevi, navoji, oznake serija, šifre kao „SQ" i „SC") prolazi netaknuto,
 * samo se ujednači zapis. Skripta na kraju prijavi svaku reč koju ne zna, pa
 * se spisak dopunjava po izveštaju, a ne napamet.
 */
const RECI = {
  ORIG: "original",
  ORIGINAL: "original",
  ORGINAL: "original",
  ZAMJ: "zamenski",
  POVINUTI: "savijeni",
  POVINUTA: "savijena",
  RAVNI: "ravni",
  RAVNA: "ravna",
  RAVNO: "ravna",
  ZAKRIVLJENI: "zakrivljeni",
  ZAKRIVLJENA: "zakrivljena",
  ZAKRIVLJENO: "zakrivljena",
  ZAKRIV: "zakrivljena",
  ZAKR: "zakrivljena",
  OJAČANI: "ojačani",
  PAČJA: "pačja",
  NOGA: "noga",
  BRZO: "brzo",
  MJENJAJUČI: "izmenjivi",
  MJENJAJUĆI: "izmenjivi",
  PVC: "PVC",
  ZVIJEZDA: "zvezda",
  QUICKFIT: "Quickfit",
  CULTIMIX: "Cultimix",
  // Freze
  ŠIRI: "širi",
  KUT: "ugao",
  '90"': "90°",
  X: "x",
  // Setvospremači — „S" pred nožićem znači „sa".
  S: "sa",
  SA: "sa",
  BEZ: "bez",
  NOŽIĆ: "sa nožićem",
  NOŽIĆA: "nožića",
  NOŽIČA: "nožića",
  NOŽIĆEM: "nožićem",
  MATICOM: "maticom",
  OKVIR: "okvir",
  OKO: "sa okom",
  DUPLI: "dupli",
  MALA: "mala",
  MALE: "male",
  MALO: "malo",
  VEĆA: "veća",
  VEĆE: "veća",
  KRAČA: "kraća",
  FIRKANT: "firkant",
  "S-OPRUGE": "S-opruge",
  "S-MOTIČICE": "S-motičice",
  // Tanjirače
  DISKOVA: "diskova",
  DRVENI: "drveni",
  RUPA: "rupa",
  RUPE: "rupe",
  VANJSKI: "spoljni",
  VANJSKA: "spoljna",
  NUTARNJI: "unutrašnji",
  NUTARNJA: "unutrašnja",
  MANJI: "manji",
  VEĆI: "veći",
  VEČI: "veći",
  KUPA: "kupa",
  CODEX: "Codex",
  BIANCHI: "Bianchi",
  // Njihova oznaka izvedbe strugača, bez objašnjenja na izvoru — ostaje kao šifra.
  PLA: "PLA",
};

/** Reči koje ispadaju iz naziva — tip dela ih već nosi ili su prazan hod. */
const IZBACI = new Set(["MM", "TANJUR", "TANJURAČE", "TANJURACE"]);

/**
 * Ispravke zapisa pre deljenja naziva na reči — mere koje su kod njih
 * rastavljene razmakom („20 X 200", „M 10x 38", „FI 18") spajaju se u jedan
 * token, da ne ulaze u naziv rasuto.
 */
const PRE = [
  [/\bfi\s+(\d)/gi, "fi$1"],
  // Bez cifre i kose crte levo, da „1/2 X 1 1/2UNF" (coli) ostane rastavljeno.
  [/(?<!\/)(\d)\s*[xX]\s*(\d)/g, "$1x$2"],
  [/\bM\s+(\d)/g, "M$1"],
  // Skraćeni oblik „BEZ NOŽ." / „S NOŽ." — ista stvar, ceo zapis.
  [/\bBEZ NOŽ\.?(?=\s|$)/gi, "BEZ NOŽIĆA"],
  [/\bS NOŽ\.(?=\s|$)/gi, "S NOŽIĆEM"],
  // „VIJAK … S PERA" je zavrtanj S-opruge; „+" u naslovu je nabrajanje.
  [/\bS[- ]PERA\b/gi, "S-opruge"],
  [/\bS[- ]MOTIČICE\b/gi, "S-motičice"],
  [/\+/g, " "],
];

/* --------------------------------- Prevod --------------------------------- */

/** „&#x2B;" → „+", višak razmaka, tipografske sitnice. */
const ocisti = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
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
  // uvek veliko M („m20x1.5" → „M20x1.5"), prečnik uvek malo fi.
  t = t
    .replace(/(\d)X(\d)/g, "$1x$2")
    .replace(/m(\d+)x/g, "M$1x")
    .replace(/FI(?=\d)/g, "fi");
  return t;
}

/** Reči koje rečnik ne zna — prijavljuju se na kraju, da se `RECI` dopuni. */
const nepoznateReci = new Map();

/**
 * Razlaže sirov naslov u tip, marke, stranu i ostatak. Vraća `null` kad tip
 * nije prepoznat — takav komad se ne uvozi, nego se prijavi na kraju.
 */
function prevedi(sirovo, kategorija) {
  const naslov = ocisti(sirovo);
  const tip = kategorija.tipovi.find((t) => t.uzorak.test(naslov));
  if (!tip) return null;

  const m = naslov.match(tip.uzorak);
  // Kod ležaja oznaka stoji IZMEĐU „LEŽAJ" i „ROTO DRLJAČE" („LEŽAJ 30210 A ROTO
  // DRLJAČE BREVIGLIERI"), pa je uzorak hvata kao grupu i vraća je u ostatak.
  const uhvaceno = m[1] ? `${m[1]} ` : "";
  let ostatak = uhvaceno + naslov.slice(m[0].length);

  for (const [uzorak, zamena] of [...(kategorija.pre ?? []), ...PRE]) {
    ostatak = ostatak.replace(uzorak, zamena);
  }

  const recnik = tip.reci ? { ...RECI, ...tip.reci } : RECI;
  const marke = [];
  let strana = null;
  const reci = [];

  const dodajMarku = (token) => {
    const marka = nadjiMarku(token);
    if (marka && !marke.includes(marka)) marke.push(marka);
    return Boolean(marka);
  };

  const dodajRec = (token) => {
    // Tačka na kraju skraćenice („ZAKR.", „ZAMJ.") ne ulazi u ključ rečnika.
    const kljuc = token.toUpperCase().replace(/\.$/, "");
    if (IZBACI.has(kljuc)) return;
    if (recnik[kljuc]) {
      reci.push(recnik[kljuc]);
      return;
    }
    // Šifre i oznake serija (SQ, SC, UC, AT20) prolaze; prava reč je propust
    // u rečniku, pa ide u izveštaj.
    if (/^[A-ZČĆŠĐŽ]{4,}$/.test(kljuc)) {
      nepoznateReci.set(kljuc, (nepoznateReci.get(kljuc) ?? 0) + 1);
    }
    reci.push(mera(token));
  };

  for (let token of ostatak.split(" ").filter(Boolean)) {
    // Zapeta iza marke u nabrajanju („POTTINGER, SICMA, MALETTI, BEFA")
    token = token.replace(/,$/, "");
    if (!token || token === "-") continue;

    // Marka, strana i mere u jednom tokenu: „KVERN.D.320/100/15".
    const troje = token.match(/^([A-ZČĆŠĐŽ&]+\.?)([DL])\.(\d\S*)$/i);
    if (troje && nadjiMarku(troje[1]) && !strana) {
      dodajMarku(troje[1]);
      strana = STRANE[`${troje[2].toUpperCase()}.`];
      reci.push(mera(troje[3]));
      continue;
    }

    // Marka i strana bez mera: „BREVIGL.D.", „EBERHARDT.DESNI1560".
    const markaStrana = token.match(/^([A-ZČĆŠĐŽ&]+)\.(D|L|DESNI|LIJEVI)\.?(\d*)$/i);
    if (markaStrana && nadjiMarku(markaStrana[1]) && !strana) {
      dodajMarku(markaStrana[1]);
      strana = STRANE[markaStrana[2].toUpperCase()];
      if (markaStrana[3]) reci.push(markaStrana[3]);
      continue;
    }

    // Marka zalepljena tačkom za reč: „ZAKRIV.RAU" → „zakrivljena" + Rau.
    const uzMarku = token.match(/^([A-ZČĆŠĐŽ]{2,}\.?)\.([A-ZČĆŠĐŽ&]+)$/i);
    if (uzMarku && nadjiMarku(uzMarku[2]) && !nadjiMarku(uzMarku[1]) && !STRANE[uzMarku[1].toUpperCase()]) {
      dodajRec(uzMarku[1]);
      dodajMarku(uzMarku[2]);
      continue;
    }

    // Strana zalepljena za ostatak: „D.305/110/68" → „D." + „305/110/68",
    // „D.HOWARD" → „D." + „HOWARD".
    const zalepljena = token.match(/^([DL])\.(\S+)$/i);
    if (zalepljena && !strana && (/\d/.test(zalepljena[2]) || nadjiMarku(zalepljena[2]))) {
      strana = STRANE[`${zalepljena[1].toUpperCase()}.`];
      token = zalepljena[2];
    }

    // Reč i strana u jednom tokenu: „KUPA-D.".
    const recStrana = token.match(/^([A-ZČĆŠĐŽ]+)-([DL])\.?$/i);
    if (recStrana && !strana && !nadjiMarku(token)) {
      strana = STRANE[`${recStrana[2].toUpperCase()}.`];
      token = recStrana[1];
    }

    // „PEGORARO,RAU", „SICMA/LANDSBERG", „KUHN/KVER.", „FERABOLI-VICON",
    // „RAVNO-KONGSKILDE" — deli se čim je bar jedan deo marka.
    const delovi = token.split(/[,/]|(?<=[A-ZČĆŠĐŽ])-(?=[A-ZČĆŠĐŽ])/i).filter(Boolean);
    if (delovi.length > 1 && delovi.some((d) => nadjiMarku(d))) {
      for (const deo of delovi) if (!dodajMarku(deo)) dodajRec(deo);
      continue;
    }

    // Marka zalepljena za mere: „AMAZONE115x55x3".
    const zalepljenaMarka = token.match(/^([A-ZČĆŠĐŽ]+)(\d.*)$/i);
    if (zalepljenaMarka && nadjiMarku(zalepljenaMarka[1])) {
      dodajMarku(zalepljenaMarka[1]);
      reci.push(mera(zalepljenaMarka[2]));
      continue;
    }

    if (dodajMarku(token)) continue;

    if (STRANE[token.toUpperCase()] && !strana && !/\d/.test(token)) {
      strana = STRANE[token.toUpperCase()];
      continue;
    }

    dodajRec(token);
  }

  const imeMarke = (mk) => mk.ime ?? mk.label;
  const name = [tip.naziv ?? tip.label, marke.map(imeMarke).join(" / "), reci.join(" ")]
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
        // `nopic.png` je njihov placeholder — takav komad ostaje bez slike.
        slika: slika && !/nopic/i.test(slika)
          ? slika.startsWith("/") ? `${ORIGIN}${slika}` : slika
          : null,
      },
    ];
  });
}

/** Ceo spisak jedne kategorije, kroz sve strane. */
async function spisak(kategorija) {
  const svi = new Map();
  for (let strana = 1; strana < 40; strana++) {
    const redovi = izMreze(await html(`${kategorija.putanja}?p=${strana}&s=200`));
    const novih = redovi.filter((r) => !svi.has(r.id));
    for (const r of novih) svi.set(r.id, r);
    process.stdout.write(`\r  ${kategorija.slug}, strana ${strana}: ${svi.size} proizvoda   `);
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

// Stabilni kataloški brojevi: postojeći se čuvaju po njihovom id-u.
const postojeci = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : [];
const brojPoIzvoru = new Map(postojeci.map((r) => [String(r.izvor?.id), r.id]));
let sledeci = Math.max(ID_OD - 1, ...postojeci.map((r) => Number(r.id))) + 1;

const redovi = [];
const neprepoznati = [];
const bezMarke = [];

for (const kategorija of KATEGORIJE) {
  const sirovi = await spisak(kategorija);

  // Prvi uvoz numeriše po potkategoriji pa nazivu — da se srodni komadi nađu
  // jedan do drugog u kataloškom indeksu.
  const poRedu = [...sirovi].sort(
    (a, b) =>
      a.potkategorija.localeCompare(b.potkategorija, "hr") ||
      a.naziv.localeCompare(b.naziv, "hr"),
  );

  for (const s of poRedu) {
    const prevod = prevedi(s.naziv, kategorija);
    if (!prevod) {
      neprepoznati.push(`${kategorija.slug}: ${s.naziv}`);
      continue;
    }
    if (prevod.brand === "univerzalno") bezMarke.push(s.naziv);

    const id = brojPoIzvoru.get(String(s.id)) ?? String(sledeci++);
    redovi.push({
      id,
      ...prevod,
      group: kategorija.grupa.key,
      groupLabel: kategorija.grupa.label,
      kategorija: kategorija.slug,
      izvor: { id: s.id, sifra: s.sifra, url: s.url, cena: s.cena, naziv: s.naziv, slika: s.slika },
    });
  }
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

let skinuto = 0;
const neuspele = [];
for (const r of redovi) {
  if (!r.izvor.slika) continue;
  const webPutanja = `/images/${r.kategorija}/${r.id}.jpg`;
  if (DRY) {
    imageMap[r.id] = webPutanja;
    continue;
  }
  const folder = resolve(ORIGINALS_DIR, r.kategorija);
  mkdirSync(folder, { recursive: true });
  // Velika slika ima istu putanju kao mala, samo u drugom folderu.
  const velika = r.izvor.slika.replace("/slike/male/", "/slike/velike/");
  try {
    if ((await skiniSliku(velika, resolve(folder, `${r.id}.webp`))) === "ok") skinuto++;
    imageMap[r.id] = webPutanja;
  } catch (e) {
    neuspele.push(`${r.id} ← ${velika} (${e.message})`);
  }
  process.stdout.write(`\r  slike: ${skinuto} novih   `);
}
console.log();

/* --- Upis --- */

if (!DRY) {
  // Delovi kojih više nema na izvoru ispadaju i iz mape slika.
  const nasi = KATEGORIJE.map((k) => `/images/${k.slug}/`);
  const aktivni = new Set(redovi.map((r) => r.id));
  for (const id of Object.keys(imageMap)) {
    if (nasi.some((f) => imageMap[id].startsWith(f)) && !aktivni.has(id)) delete imageMap[id];
  }
  writeFileSync(OUT_FILE, `${JSON.stringify(redovi, null, 2)}\n`);
  writeFileSync(IMAGES_FILE, `${JSON.stringify(imageMap, null, 2)}\n`);
}

/* --- Izveštaj --- */

/** Koliko puta se koja vrednost polja javlja, od najčešće. */
const prebroj = (lista, kljuc) => {
  const broj = new Map();
  for (const r of lista) broj.set(r[kljuc], (broj.get(r[kljuc]) ?? 0) + 1);
  return [...broj].sort((a, b) => b[1] - a[1]);
};

console.log(`\nUvezeno: ${redovi.length} delova (${DRY ? "dry — ništa nije upisano" : OUT_FILE})`);
for (const kategorija of KATEGORIJE) {
  const svoji = redovi.filter((r) => r.kategorija === kategorija.slug);
  console.log(`\n  ${kategorija.grupa.label} — ${svoji.length}`);
  for (const [tip, n] of prebroj(svoji, "partTypeLabel")) {
    console.log(`    ${String(n).padStart(4)}  ${tip}`);
  }
}
console.log(`\nMarke: ${prebroj(redovi, "brandLabel").map(([m, n]) => `${m} (${n})`).join(", ")}`);

// Probni prolaz je tu da se nazivi pročitaju pre nego što uđu u katalog.
if (DRY) {
  console.log("\nPrevod naziva:");
  for (const r of redovi) console.log(`  ${r.izvor.naziv}\n    → ${r.name}`);
}
if (bezMarke.length) console.log(`\nBez prepoznate marke (${bezMarke.length}):\n  ${bezMarke.join("\n  ")}`);
if (nepoznateReci.size) {
  console.log(`\nReči van rečnika — dopuni RECI ako su naše (${nepoznateReci.size}):`);
  console.log(`  ${[...nepoznateReci].sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} (${n})`).join(", ")}`);
}
if (neprepoznati.length) console.log(`\nNEPREPOZNAT TIP — dopuni TIPOVI (${neprepoznati.length}):\n  ${neprepoznati.join("\n  ")}`);
if (neuspele.length) console.log(`\nSlike koje nisu skinute (${neuspele.length}):\n  ${neuspele.join("\n  ")}`);
console.log(`\nSledeći korak: npm run slike:kadar -- ferencak, pa npm run catalog`);
