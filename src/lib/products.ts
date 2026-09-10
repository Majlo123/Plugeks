/**
 * Serverski model proizvoda — jedinstveni pogled na mašine i delove za
 * pojedinačne stranice `/proizvod/[slug]` i za sitemap.
 *
 * Ovaj modul se učitava SAMO na serveru (u server komponentama, generateMetadata,
 * generateStaticParams i sitemap-u). Zato sme da statički uveze i `parts.json`
 * (~300 KB) — taj teret nikad ne ode u pretraživač. Klijentski katalog i dalje
 * koristi lazy `loadParts()` iz `@/lib/catalog`.
 *
 * Sav opisni tekst ovde je originalan (napisan za PlugekS) — ne prevodi se sa
 * izvornog sajta.
 */

import machinesJson from "@/data/machines.json";
import packedParts from "@/data/parts.json";
import imagesJson from "@/data/images.json";
import machineImagesJson from "@/data/machine-images.json";
import { uzBroj } from "@/lib/brojevi";
import {
  GRANE,
  granaKljucevi,
  granaZaTip,
  tipLabel,
  type GranaKljuc,
} from "@/lib/masine";
import { poredaj, rang } from "@/lib/redosled";
import {
  productSlug,
  idFromSlug,
  trailerRows,
  TRAILER_BRAND,
  TRAILER_PROGRAMS,
} from "@/lib/catalog";

// Ručne slike mašina gaze generisanu mapu — vidi komentar u lib/catalog.ts.
const productImages: Record<string, string> = {
  ...(imagesJson as Record<string, string>),
  ...(machineImagesJson as Record<string, string>),
};

/* ---------------------------------- Model ---------------------------------- */

/**
 * Tabela tehničkih podataka mašine — matrica, ne spisak parova.
 *
 * `kolone` su izvedbe iste mašine („TERA HP 210", „TERA HP 240"…), a svaki red
 * u `redovi` počinje nazivom osobine pa nosi po jednu vrednost za svaku kolonu:
 * `["Masa", "535 kg", "560 kg", "595 kg"]`.
 *
 * Popunjava je `npm run masine` sa slovenačke verzije izvora — jedine na kojoj
 * te tabele nisu prazne (vidi `scripts/import-hofman.mjs`).
 */
export type TabelaModela = { kolone: string[]; redovi: string[][] };

export type ProductKind = "masina" | "deo" | "prikolica" | "oprema";

export type Product = {
  kind: ProductKind;
  id: string;
  slug: string;
  name: string;
  /** Kratak podnaslov (mašine). */
  tagline?: string;
  /** Lokalna putanja do fotografije ako postoji. */
  image?: string;
  /** Ključ + naziv kategorije (grupe) za breadcrumb i filter. */
  groupKey: string;
  groupLabel: string;
  /** Tip — za mašine „podgrupa" (tanjirace…), za delove tip dela (lemes…). */
  typeKey?: string;
  typeLabel?: string;
  brandKey?: string;
  brandLabel?: string;
  /** Grana mašine (poljoprivredne / šumske / građevinske) — samo kod mašina. */
  granaKey?: GranaKljuc;
  granaLabel?: string;
  sideKey?: string;
  sideLabel?: string;
  /** Fabrička oznaka modela bez naše reči ispred („LIGHT 23 DA"). */
  model?: string;
  /** Tehnička specifikacija — [naziv, vrednost], redosled je i redosled prikaza. */
  specs?: [string, string][];
  /** Tehnički opis komada opreme (marka, nosivost, materijal) — vidi `trailers.json`. */
  note?: string;
  /** Tabela modela (mašine) — vidi `TabelaModela`. */
  tabela?: TabelaModela;
};

/* -------------------------------- Jezik ----------------------------------- */

/**
 * Kongruencija imenice uz broj u srpskom: 1 → „kataloški broj", 2–4 →
 * „kataloška broja", ostalo → „kataloških brojeva". Izuzetak su 11–14, koji uz
 * sebe uvek nose množinu („13 brojeva", ne „13 broja").
 *
 * Postoji zato što se brojevi na kategorijskim stranicama ispisuju iz podataka,
 * pa bi fiksni oblik dao „323 kataloških brojeva" umesto „323 kataloška broja" —
 * sitnica koju čitalac odmah primeti i koja stranicu čini automatski
 * generisanom, što je i za posetioca i za Google loš signal.
 *
 * Sama funkcija je u `lib/brojevi.ts` (klijent-safe), ovde se samo re-exportuje
 * da pozivi sa kategorijskih stranica ostanu nepromenjeni.
 */
export { uzBroj };

/** Najčešći slučaj na kategorijskim stranicama. */
export const katBrojeva = (n: number) =>
  `${n} ${uzBroj(n, "kataloški broj", "kataloška broja", "kataloških brojeva")}`;

/* ------------------------------- Slug helpers ------------------------------ */

// productSlug / idFromSlug žive u catalog.ts (klijent-safe); ovde ih re-exportujemo.
export { productSlug, idFromSlug };

export const productHref = (p: Product) => `/proizvod/${p.slug}`;

/* -------------------------------- Mašine ---------------------------------- */

type MachineRow = {
  id: string;
  name: string;
  group: string;
  /** Grana — poljoprivredne / šumske / građevinske. */
  grana: GranaKljuc;
  subgroup: string;
  tagline: string;
  brand: string;
  tabela?: TabelaModela;
};

/** Marke mašina u ponudi. Ključ je `brand` iz `machines.json`. */
const MACHINE_BRANDS: Record<string, string> = {
  rolland: "Rolland",
  hofman: "Hofman",
};

function buildMachine(m: MachineRow): Product {
  const tip = tipLabel(m.subgroup) ?? "Mašine";
  return {
    kind: "masina",
    id: m.id,
    slug: productSlug(m.name, m.id),
    name: m.name,
    tagline: m.tagline || undefined,
    // Samo PRAVA fotografija proizvoda; bez nje → brendiran placeholder (ne
    // generička traktor-slika koja pogrešno predstavlja mašinu).
    image: productImages[m.id],
    // Grupa mašine je njen TIP (tanjirače, cepači drva…), a ne grana: to je
    // ono što stoji na kartici i u breadcrumb-u, i ono što ima svoju stranu.
    groupKey: m.subgroup,
    groupLabel: tip,
    typeKey: m.subgroup,
    typeLabel: tip,
    granaKey: m.grana,
    granaLabel: GRANE[m.grana]?.label,
    brandKey: m.brand,
    brandLabel: MACHINE_BRANDS[m.brand] ?? m.brand,
    tabela: m.tabela,
  };
}

/** Izvedbe mašine iz tabele („TERA HP 210, TERA HP 240, TERA HP 280"). */
export const modeliMasine = (p: Product): string[] => p.tabela?.kolone ?? [];

/* ------------------------ Auto-prikolice i njihova oprema ------------------ */

/**
 * Prikolica i dodatna oprema dele istu granu sajta (`/prikolice`), ali su
 * različite vrste proizvoda: prikolica ima tabelu specifikacije, komad opreme
 * ima tehnički opis i podatak na koju grupu prikolica ide.
 */
function buildTrailer(t: (typeof trailerRows)[number]): Product {
  const oprema = t.vrsta === "oprema";
  const program = TRAILER_PROGRAMS[t.facets.program];

  return {
    kind: oprema ? "oprema" : "prikolica",
    id: t.id,
    slug: productSlug(t.name, t.id),
    name: t.name,
    model: t.model,
    tagline: t.tagline,
    note: t.note,
    image: t.image,
    groupKey: oprema ? "oprema-prikolice" : "prikolice",
    groupLabel: oprema ? "Oprema za prikolice" : "Auto-prikolice",
    typeKey: t.facets.program,
    typeLabel: program?.oznaka ?? t.tagline,
    brandKey: TRAILER_BRAND.key,
    brandLabel: TRAILER_BRAND.label,
    specs: t.specs,
  };
}

/* -------------------------------- Delovi ---------------------------------- */

type PackedParts = {
  groups: { key: string; label: string }[];
  types: { key: string; label: string }[];
  brands: { key: string; label: string }[];
  sides: { key: string; label: string }[];
  items: [string, string, number, number, number, number][];
};

function buildPart(
  row: [string, string, number, number, number, number],
  tables: PackedParts,
): Product {
  const [id, name, g, t, b, s] = row;
  const at = <T,>(table: T[], i: number) => (i >= 0 ? table[i] : undefined);
  const group = at(tables.groups, g);
  const type = at(tables.types, t);
  const brand = at(tables.brands, b);
  const side = at(tables.sides, s);

  return {
    kind: "deo",
    id,
    slug: productSlug(name, id),
    name,
    image: productImages[id],
    groupKey: group?.key ?? "delovi",
    groupLabel: group?.label ?? "Rezervni delovi",
    typeKey: type?.key,
    typeLabel: type?.label,
    brandKey: brand?.key,
    brandLabel: brand?.label,
    sideKey: side?.key,
    sideLabel: side?.label,
  };
}

/* ------------------------------- Indeksi ---------------------------------- */

let cache: {
  all: Product[];
  byId: Map<string, Product>;
  bySlug: Map<string, Product>;
} | null = null;

function build() {
  if (cache) return cache;

  const machines = (machinesJson as MachineRow[]).map(buildMachine);
  const prikolice = trailerRows.map(buildTrailer);
  const tables = packedParts as unknown as PackedParts;
  const parts = tables.items.map((row) => buildPart(row, tables));

  // Redosled se propisuje JEDNOM, ovde (vidi `lib/redosled.ts`). Sve niže
  // funkcije samo filtriraju `all`, a `Array.filter` čuva redosled — pa svaka
  // kategorijska strana, kataloški indeks i sitemap nasleđuju isti raspored bez
  // ijednog dodatnog `sort`-a. Sortira se po vrsti, da grupisanje
  // (mašine → prikolice → delovi) u kataloškom indeksu ostane netaknuto.
  // `Product` se već poklapa sa `ZaRedosled`, pa mu ključ ne treba prevod.
  const sam = (p: Product) => p;
  const all = [
    ...poredaj(machines, sam),
    ...poredaj(prikolice, sam),
    ...poredaj(parts, sam),
  ];
  const byId = new Map<string, Product>();
  const bySlug = new Map<string, Product>();
  for (const p of all) {
    byId.set(p.id, p);
    bySlug.set(p.slug, p);
  }

  cache = { all, byId, bySlug };
  return cache;
}

export function getAllProducts(): Product[] {
  return build().all;
}

export function getMachines(): Product[] {
  return build().all.filter((p) => p.kind === "masina");
}

export function getTrailers(): Product[] {
  return build().all.filter((p) => p.kind === "prikolica");
}

export function getTrailerAccessories(): Product[] {
  return build().all.filter((p) => p.kind === "oprema");
}

/**
 * Proizvodi koji imaju PRAVU fotografiju (a ne ilustraciju kategorije) — za
 * image sitemap. Prazno dok se ne popuni `public/images/rolland/` + images.json
 * (vidi `npm run slike`).
 */
export function getProductsWithPhotos(): Product[] {
  return build().all.filter((p) => Boolean(p.image));
}

/** Traži po canonical slug-u; ako se ne poklopi, pokušava po id-u iz slug-a. */
export function getProductBySlug(slug: string): Product | undefined {
  const { bySlug, byId } = build();
  const exact = bySlug.get(slug);
  if (exact) return exact;
  const id = idFromSlug(slug);
  return id ? byId.get(id) : undefined;
}

/**
 * Srodni proizvodi za dno stranice. Bira iste kategorije/tipa, pa istog brenda,
 * uz stabilan (deterministički) redosled — bez `Math.random`.
 */
export function relatedProducts(p: Product, limit = 4): Product[] {
  const { all } = build();
  const score = (o: Product) => {
    if (o.id === p.id) return -1;
    if (o.kind !== p.kind) return -1;
    let s = 0;
    if (o.typeKey && o.typeKey === p.typeKey) s += 3;
    if (o.brandKey && o.brandKey === p.brandKey) s += 2;
    if (o.groupKey === p.groupKey) s += 1;
    return s;
  };
  return all
    .map((o) => ({ o, s: score(o) }))
    .filter((x) => x.s > 0)
    // Isti propisani red kao svuda (crtež pre fotografije pre praznog, obični
    // deo pre predplužnjakovog) — ali tek posle srodnosti: bolje je pokazati
    // pravi srodan deo bez slike nego tuđi sa slikom.
    .sort(
      (a, b) =>
        b.s - a.s ||
        rang(a.o) - rang(b.o) ||
        a.o.name.localeCompare(b.o.name, "sr"),
    )
    .slice(0, limit)
    .map((x) => x.o);
}

/* ------------------------------ Opisni tekst ------------------------------ */
/* Originalni srpski tekst pisan za PlugekS — nije prevod izvornog sajta.     */

/** Detaljan opis mašine (po id-u). Piše se ljudski, bez izmišljanja brojki. */
const MACHINE_COPY: Record<string, string> = {
  "4394":
    "Field Hawk BH je hidraulična tanjirača namenjena velikom dnevnom učinku. Hidrauličko sklapanje krila skraćuje pripremu za transport i prelazak između parcela, a agresivan ugao diskova brzo usitnjava žetvene ostatke i priprema zemljište u jednom prohodu.",
  "4396":
    "Field BT je nošena tanjirača za svakodnevnu obradu na malim i srednjim gazdinstvima. Jednostavna je za priključivanje i održavanje, a dobro drži dubinu i ravnomerno meša strnište — dobar izbor za brzu obradu posle žetve.",
  "4395":
    "Field AT je tanjirasti agregat sa zadnjim valjkom koji u jednom prohodu usitni, poravna i delimično zbije zemljište. Time se priprema kvalitetna setvena osnova uz manje prohoda i uštedu goriva.",
  "4575":
    "BH-PA je hidraulična polunošena tanjirača za veće površine. Polunošena konstrukcija sa transportnim točkovima rasterećuje traktor i omogućava stabilan rad pri većim radnim brzinama.",
  "4576":
    "BH-PB je hidraulična polunošena tanjirača građena za intenzivnu obradu većih parcela. Hidrauličko sklapanje i robusan ram omogućavaju siguran transport i pouzdan rad tokom cele sezone.",
  "4577":
    "BTP je polunošena tanjirača velikog kapaciteta. Namenjena je gazdinstvima kojima je bitan učinak po satu — veliki radni zahvat pokriva više hektara dnevno uz stabilan hod.",
  "4692":
    "ATP je polunošeni tanjirasti agregat koji spaja veliki radni zahvat sa stabilnošću polunošene konstrukcije. Kombinacija diskova i valjka daje poravnatu, prozračnu setvenu osnovu.",
  "4703":
    "Grander AB je bezoranični (no-till) agregat za obradu bez prevrtanja plodnog sloja. Radnim telima rastresa i meša zemljište uz očuvanje vlage i strukture — osnova sistema konzervacijske obrade.",
  "4704":
    "Grander ABL je laka verzija bezoraničnog agregata prilagođena manjim traktorima. Omogućava plitku obradu strništa i mešanje žetvenih ostataka uz manju potrošnju snage.",
  "4705":
    'Deeper GBK "Kret" je podrivač za razbijanje tabana pluga i poboljšanje drenaže zemljišta. Radi u dubini bez prevrtanja sloja, čime se obnavlja propusnost za vodu i vazduh i podstiče razvoj korena.',
  "4706":
    'Deeper GBM "Michel" je podrivač za dubinsko rastresanje zbijenih slojeva. Bez prevrtanja plodnog sloja probija zbijeni taban i vraća zemljištu prozračnost — pogodan pred setvu okopavina.',
  "4397":
    "Valjci za obradu zemljišta služe za poravnavanje i zbijanje površine posle obrade i za razbijanje grudvi. Biraju se prema tipu zemljišta i kombinuju sa agregatima i tanjiračama.",
};

/**
 * Vraća opis mašine; ako specifičan ne postoji, gradi solidan podrazumevani.
 *
 * Marka i grana se čitaju iz samog proizvoda — ranije je ovde stajalo fiksno
 * „iz Rolland programa za obradu zemljišta", što je posle uvoza Hofman
 * programa bilo netačno za tri četvrtine kataloga (i za svaki cepač drva).
 */
export function machineDescription(p: Product): string {
  if (MACHINE_COPY[p.id]) return MACHINE_COPY[p.id];

  // Naziv tipa se NE ubacuje u rečenicu: nazivi tipova su u množini („Cepači
  // drva"), pa bi dalo „REX je cepači drva". Sam naziv mašine ionako počinje
  // našom imenicom u jednini („Cepač drva REX"), pa je tip tu suvišan.
  const program = p.brandLabel ? ` iz ${p.brandLabel} programa` : "";
  const posao = p.granaKey ? ` ${POSAO_GRANE[p.granaKey]}` : "";
  return `${p.name} je mašina${program}${posao}. Recite nam čime raspolažete i kakav vam je posao — preporučujemo odgovarajući model i konfiguraciju, i šaljemo ponudu sa cenom i rokom isporuke.`;
}

/** Za koji posao je grana — ulazi u podrazumevani opis mašine. */
const POSAO_GRANE: Record<GranaKljuc, string> = {
  poljoprivredne: "za rad na gazdinstvu",
  sumske: "za rad u šumi i pripremu ogreva",
  gradjevinske: "za zemljane radove i uređenje terena",
};

/** Ključne prednosti mašine po tipu — kratke, iskrene stavke (bez brojki). */
export function machineHighlights(p: Product): string[] {
  const common = [
    "Garancija i obezbeđeni rezervni delovi",
    "Mogućnost kupovine preko subvencija i na rate",
    "Isporuka širom Srbije i regiona",
  ];
  const byType: Record<string, string[]> = {
    tanjirace: ["Brza obrada strništa u jednom prohodu", "Ravnomerno mešanje žetvenih ostataka"],
    agregati: ["Priprema setvene osnove uz manje prohoda", "Ušteda goriva i vremena"],
    podrivaci: ["Razbijanje tabana pluga bez prevrtanja sloja", "Bolja drenaža i razvoj korena"],
    valjci: ["Poravnavanje i zbijanje površine", "Kombinuju se sa agregatima i tanjiračama"],
    "obrada-zemljista": ["Priprema zemljišta pre setve", "Radni zahvat biramo prema snazi traktora"],
    malceri: ["Usitnjavanje žetvenih ostataka i rastinja", "Radna širina prema snazi traktora"],
    kosenje: ["Košenje, okretanje i baliranje u jednom programu", "Priključci se biraju prema veličini parcela"],
    "setva-zetva": ["Podešavanje razmaka i dubine setve", "Rezervni delovi obezbeđeni"],
    "prskalice-rasipaci": ["Ravnomerna raspodela po celoj radnoj širini", "Lako čišćenje i održavanje"],
    "traktorske-prikolice": ["Nosivost i sanduk biramo prema poslu", "Kiper izvedba po izboru"],
    "mesaone-mlinovi": ["Priprema smeše na gazdinstvu", "Kapacitet prema veličini stada"],
    cepaci: ["Kardanski, električni ili benzinski pogon", "Sila cepanja prema debljini trupca"],
    iveraci: ["Usitnjavanje grana u iver", "Prečnik grane prema modelu"],
    "pile-testere": ["Rezanje ogreva na meru", "Zaštitni sistemi u standardu"],
    "sumske-prikolice": ["Nosivost i dohvat dizalice po izboru", "Za izvlačenje trupaca sa terena"],
    "klesta-prikljucci": ["Priključuje se na postojeću mašinu", "Kompatibilnost potvrđujemo pre isporuke"],
    "mini-bageri": ["Prolaze kroz uske prilaze i kapije", "Bogat izbor dodatne opreme"],
    "mini-utovarivaci": ["Utovar i prenos na skučenom terenu", "Priključci se menjaju bez alata"],
    "mini-dumperi": ["Prevoz materijala po neuređenom terenu", "Gusenice za mek i blatnjav teren"],
  };
  return [...(byType[p.typeKey ?? ""] ?? []), ...common];
}

/* ------------------------- Auto-prikolice — tekst ------------------------- */

/** Vrednost iz specifikacije po nazivu reda: („Nosivost”) → „610 kg”. */
const spec = (p: Product, naziv: string) => p.specs?.find(([k]) => k === naziv)?.[1];

/** Broj kilograma iz reda specifikacije: „750 kg” → 750. */
const kilogrami = (v?: string) => Number(String(v ?? "").replace(/\D/g, "")) || 0;

/** Preko 750 kg prikolica traži B+E (ili B96) — to se ne sme prećutati. */
const B_KATEGORIJA = 750;

/**
 * Genitiv materijala, da rečenica ostane pismena („pocinkovani lim” →
 * „od pocinkovanog lima”). Nepoznat materijal se ne deklinuje nasumično nego
 * ispiše kao stavka — bolje suvo nego pogrešno.
 */
const MATERIJAL_GENITIV: Record<string, string> = {
  "pocinkovani lim": "pocinkovanog lima",
  "vodootporni šper": "vodootporne šperploče",
  "laminirana šperploča": "laminirane šperploče",
  "toplo cinkovani perforirani lim": "toplo cinkovanog perforiranog lima",
  aluminijum: "aluminijuma",
};

function recenicaMaterijala(uvod: string, stavka: string, vrednost: string): string {
  const genitiv = MATERIJAL_GENITIV[vrednost.toLowerCase()];
  return genitiv ? `${uvod} od ${genitiv}.` : `${stavka}: ${vrednost.toLowerCase()}.`;
}

/** Rečenica o nameni serije — „za prevoz plovila”, „platforma bez stranica”… */
const NAMENA: Record<string, string> = {
  uno: "Otvorena prikolica sa stranicama, za svakodnevni prevoz oko kuće i bašte.",
  light: "Otvorena prikolica sa stranicama, za građevinski materijal, alat i kabastu robu.",
  plato: "Platforma bez stranica — teret se utovaruje sa svih strana i vezuje za pod.",
  cargo: "Veća prikolica sa kočionim sistemom, za teži i kabastiji teret.",
  transporter: "Prikolica za prevoz vozila, sa rampama za navoz.",
  craft: "Prikolica za prevoz građevinskih mašina — bagera, mini utovarivača i sličnog, sa rampama za navoz.",
  marine: "Prikolica za prevoz plovila, sa podesivim ležištima i vodilicama za spuštanje u vodu.",
  moto: "Prikolica za prevoz motocikala, sa vodilicom točka i tačkama za vezivanje.",
};

/**
 * Opis prikolice se sastavlja iz njene specifikacije — bez izmišljanja brojki i
 * bez preuzimanja marketinškog teksta sa proizvođačevog sajta.
 */
export function trailerDescription(p: Product): string {
  if (p.kind === "oprema") return accessoryDescription(p);

  const masa = spec(p, "Najveća dozvoljena masa");
  const dvoosovinska = spec(p, "Broj osovina") === "2";
  const prostor =
    spec(p, "Tovarni prostor (D × Š × V)") ?? spec(p, "Tovarni prostor (D × Š)");
  const nosivost = spec(p, "Nosivost");
  const stranice = spec(p, "Materijal stranica");
  const pod = spec(p, "Materijal poda");
  const kiper = spec(p, "Kiper (nagibni sanduk)") ?? "";
  const kocnice = spec(p, "Kočioni sistem") ?? "";
  const doB = kilogrami(masa) <= B_KATEGORIJA;

  return [
    `${p.name} je ${dvoosovinska ? "dvoosovinska" : "jednoosovinska"} prikolica${
      masa ? ` najveće dozvoljene mase ${masa}` : ""
    }.`,
    // Vozačka kategorija zavisi od mase — do 750 kg je B, preko toga se gleda i
    // masa skupa, pa se ništa ne tvrdi umesto kupca.
    masa
      ? doB
        ? "Do 750 kg vuče se i sa B kategorijom, bez dodatne dozvole."
        : "Preko 750 kg je potrebna B+E kategorija (ili B96) — proverite i dozvoljenu masu skupa za vaše vozilo."
      : null,
    NAMENA[p.typeKey ?? ""] ?? null,
    prostor && nosivost ? `Tovarni prostor je ${prostor}, a nosivost ${nosivost}.` : null,
    stranice ? recenicaMaterijala("Stranice su", "Materijal stranica", stranice) : null,
    pod ? recenicaMaterijala("Pod je", "Materijal poda", pod) : null,
    /sa kočionim/i.test(kocnice)
      ? "Osovina je sa kočionim sistemom, pa se skup zaustavlja kraće i mirnije."
      : null,
    dvoosovinska
      ? "Dvoosovinska konstrukcija mirnije se ponaša na putu i manje je osetljiva na raspored tereta."
      : null,
    /^da$/i.test(kiper)
      ? "Sanduk je nagibni (kiper), pa se rasuti materijal istovaruje bez prebacivanja."
      : /opciono/i.test(kiper)
        ? "Nagibni sanduk (kiper) se ugrađuje kao opcija."
        : null,
    /BOX/i.test(p.model ?? "")
      ? "Poklopac zatvara tovarni prostor, pa teret ostaje suv i van pogleda."
      : null,
    "Konstrukcija je pocinkovana — ne rđa i lako se pere. Javite nam šta najčešće prevozite i preporučujemo model i izvedbu.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Opis komada opreme. Oprema nema tabelu specifikacije, nego jednu tehničku
 * rečenicu sa izvora (marka, nosivost, materijal) — ona se prenosi kao podatak
 * o proizvodu, a mi dodajemo šta kupac treba da nam javi.
 */
function accessoryDescription(p: Product): string {
  // Izvor često izostavi tačku na kraju („…visina ograde - 370 mm”), pa bi se
  // naša rečenica slepila za njegovu.
  const uvod = p.note?.trim();
  return [
    uvod ? (/[.!?]$/.test(uvod) ? uvod : `${uvod}.`) : null,
    `Originalna dodatna oprema ${TRAILER_BRAND.label} za prikolice. Recite nam model prikolice i potvrđujemo kompatibilnost, cenu i rok isporuke.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Ključne stavke prikolice — sve redom iz specifikacije, bez ulepšavanja. */
export function trailerHighlights(p: Product): string[] {
  if (p.kind === "oprema") {
    return [
      `Originalna oprema ${TRAILER_BRAND.label}`,
      "Kompatibilnost potvrđujemo po modelu prikolice",
      "Isporuka širom Srbije i regiona",
    ];
  }

  const kiper = spec(p, "Kiper (nagibni sanduk)") ?? "";
  const masa = spec(p, "Najveća dozvoljena masa");
  const nosivost = spec(p, "Nosivost");
  const doB = kilogrami(masa) <= B_KATEGORIJA;

  return [
    masa
      ? `Ukupna masa ${masa}${doB ? " — vuče se sa B kategorijom" : " — traži B+E kategoriju"}`
      : null,
    nosivost ? `Nosivost ${nosivost}` : null,
    spec(p, "Broj osovina") === "2" ? "Dvoosovinska — stabilnija na putu" : null,
    /sa kočionim/i.test(spec(p, "Kočioni sistem") ?? "") ? "Osovina sa kočnicom" : null,
    /^da$/i.test(kiper)
      ? "Nagibni sanduk (kiper) u standardu"
      : /opciono/i.test(kiper)
        ? "Nagibni sanduk (kiper) kao opcija"
        : null,
    "Pocinkovana konstrukcija — zaštita od korozije",
    "Garancija i obezbeđeni rezervni delovi",
    "Isporuka širom Srbije i regiona",
  ].filter((h): h is string => Boolean(h));
}

const GROUP_CONTEXT: Record<string, string> = {
  "delovi-plugovi": "plugove",
  "delovi-agregati": "agregate i grubere",
  "delovi-tanjirace": "tanjirače",
  "delovi-sejalice": "sejalice",
  "delovi-vadilice": "vadilice krompira",
  "delovi-kosacice": "kosačice",
};

/**
 * „delovi-plugovi" → „plugove". Kontekst mašine u akuzativu, da rečenica
 * „raonik za plugove Lemken" ostane tačna i kad deo nije za plug (isti katalog
 * nosi i delove za sejalice, tanjirače i vadilice).
 */
export const kontekstMasine = (groupKey: string): string =>
  GROUP_CONTEXT[groupKey] ?? "poljoprivredne mašine";

/** Originalan, iskren opis rezervnog dela — variran po tipu/brendu/kategoriji. */
export function partDescription(p: Product): string {
  const forMachine = GROUP_CONTEXT[p.groupKey] ?? "poljoprivredne mašine";
  const brand = p.brandLabel && p.brandKey !== "univerzalno"
    ? `Odgovara mašinama proizvođača ${p.brandLabel}.`
    : "Univerzalni deo — javite model mašine da potvrdimo kompatibilnost.";
  const kind = p.typeLabel ? p.typeLabel.toLowerCase() : "rezervni deo";
  return `Rezervni deo (${kind}) za ${forMachine}. ${brand} Radimo sa proverenim dobavljačima; recite nam kataloški broj i model mašine i šaljemo ponudu sa cenom i rokom isporuke isti dan.`;
}

/* ------------------------------ Natpis slike ------------------------------ */

/**
 * Strana ugradnje u ženskom rodu, uz imenicu „strana". Oznaka u podacima je
 * muška („Levi", jer ide uz „raonik"), pa bi prosto malo slovo dalo „levi
 * strana". Vrednosti su tačno dve, pa se ne pogađa nego ispisuje.
 */
const STRANA: Record<string, string> = {
  levi: "leva strana",
  desni: "desna strana",
};

/**
 * Natpis uz fotografiju proizvoda — ono što Google Images prikaže ispod
 * rezultata. Sastavlja se od podataka koje proizvod stvarno ima; ništa se ne
 * izmišlja i ne ponavlja naziv (on već stoji kao `image:title`, odnosno kao
 * naslov stranice).
 *
 * Isti tekst ide na TRI mesta — u `image-sitemap.xml`, u `ImageObject` na
 * stranici proizvoda i u vidljivi potpis ispod slike. To poklapanje je i svrha:
 * kad Google na sva tri mesta nađe isti opis vezan za isti `contentUrl`, sliku
 * pripiše baš toj stranici, a ne širem spisku proizvoda.
 */
export function natpisSlike(p: Product): string {
  const delovi: string[] = [];

  if (p.kind === "deo") {
    const kontekst = kontekstMasine(p.groupKey);
    delovi.push(
      p.brandLabel && p.brandKey !== "univerzalno"
        ? `${p.typeLabel ?? "Rezervni deo"} za ${kontekst} ${p.brandLabel}`
        : `${p.typeLabel ?? "Rezervni deo"} za ${kontekst}`,
    );
    if (STRANA[p.sideKey ?? ""]) delovi.push(STRANA[p.sideKey!]);
    delovi.push(`kataloški broj ${p.id}`);
  } else if (p.kind === "masina") {
    delovi.push(
      [p.typeLabel ?? "Mašina", p.brandLabel, p.granaLabel?.toLowerCase()]
        .filter(Boolean)
        .join(" — "),
    );
    if (p.tagline) delovi.push(p.tagline);
  } else {
    delovi.push(
      p.kind === "oprema"
        ? `dodatna oprema ${TRAILER_BRAND.label} za auto-prikolice`
        : `auto-prikolica ${TRAILER_BRAND.label}`,
    );
    if (p.tagline) delovi.push(p.tagline);
  }

  delovi.push("PlugekS");
  return delovi.join(", ");
}

/* --------------------------- Kategorije za SEO ---------------------------- */

/**
 * Rute ispod postoje zato što je `/proizvodi` klijentska komponenta: filtrira u
 * pretraživaču i prikazuje 24 po strani uz dugme „Prikaži još". Googlebot izvrši
 * JS, ali ne klikće dugmad, pa u HTML-u nema nijednog linka ka proizvodu —
 * merenjem: 0 na `/proizvodi`, 16 na početnoj, 4 po proizvodu. Bez ovoga bi
 * ~4400 proizvoda postojalo samo u sitemap-u, bez ijednog internog linka, što
 * Google po pravilu ostavlja u „Discovered – currently not indexed".
 */

export type Kategorija = { key: string; label: string; count: number };

const sortiraj = (a: Kategorija, b: Kategorija) =>
  b.count - a.count || a.label.localeCompare(b.label, "sr");

function prebroj(
  items: Product[],
  kljuc: (p: Product) => string | undefined,
  naziv: (p: Product) => string | undefined,
): Kategorija[] {
  const mapa = new Map<string, Kategorija>();
  for (const p of items) {
    const k = kljuc(p);
    if (!k) continue;
    const postojeci = mapa.get(k);
    if (postojeci) postojeci.count += 1;
    else mapa.set(k, { key: k, label: naziv(p) ?? k, count: 1 });
  }
  return [...mapa.values()].sort(sortiraj);
}

export function getParts(): Product[] {
  return build().all.filter((p) => p.kind === "deo");
}

/** Tipovi delova (raonik, daska, plaz…) — po njima ljudi i pretražuju. */
export function partTypes(): Kategorija[] {
  return prebroj(getParts(), (p) => p.typeKey, (p) => p.typeLabel);
}

/** Brendovi plugova za koje postoje delovi (Lemken, Kuhn, Kverneland…). */
export function partBrands(): Kategorija[] {
  return prebroj(
    getParts().filter((p) => p.brandKey && p.brandKey !== "univerzalno"),
    (p) => p.brandKey,
    (p) => p.brandLabel,
  );
}

/** Tipovi mašina, kroz sve grane — za sitemap i unutrašnje linkove. */
export function machineCategories(): Kategorija[] {
  return prebroj(getMachines(), (p) => p.typeKey, (p) => p.typeLabel);
}

/**
 * Grane mašina sa brojem mašina u svakoj — poljoprivredne, šumske,
 * građevinske. Redosled je onaj iz `machine-groups.json`, a ne po broju:
 * poljoprivredne su glavni posao firme i stoje prve i kad ih ne bi bilo
 * najviše.
 */
export function machineBranches(): (Kategorija & { kratko: string; opis: string })[] {
  const masine = getMachines();
  return granaKljucevi
    .map((key) => ({
      key,
      label: GRANE[key].label,
      kratko: GRANE[key].kratko,
      opis: GRANE[key].opis,
      count: masine.filter((p) => p.granaKey === key).length,
    }))
    .filter((g) => g.count > 0);
}

/**
 * Tipovi mašina unutar jedne grane, redosledom iz `machine-groups.json`.
 * Prazan tip se izostavlja — pločica koja vodi na praznu stranu je i za kupca i
 * za Google gubitak vremena.
 */
export function machineTypesForBranch(granaKey: string): Kategorija[] {
  const grana = GRANE[granaKey as GranaKljuc];
  if (!grana) return [];
  const masine = getMachines().filter((p) => p.granaKey === granaKey);
  return Object.entries(grana.tipovi)
    .map(([key, label]) => ({
      key,
      label,
      count: masine.filter((p) => p.typeKey === key).length,
    }))
    .filter((t) => t.count > 0);
}

/** Grana kojoj tip pripada — za breadcrumb sa stranice tipa. */
export const machineBranchOfType = (tipKey: string) => granaZaTip(tipKey);

/**
 * Kategorije prikolica — po programu (LIGHT, PLATO, MARINE…). To su i naslovi
 * kategorijskih stranica: kupac traži „prikolicu za čamac”, ne „jednoosovinsku”.
 * Kartica u katalogu i dalje nosi samo kratku oznaku programa.
 */
export function trailerCategories(): Kategorija[] {
  return prebroj(
    getTrailers(),
    (p) => p.typeKey,
    (p) => `Prikolice ${TRAILER_PROGRAMS[p.typeKey ?? ""]?.oznaka ?? ""}`.trim(),
  );
}

/** Grupe dodatne opreme (Cerade, Čekrci…) — isti obrazac kao kategorije. */
export function trailerAccessoryGroups(): Kategorija[] {
  return prebroj(getTrailerAccessories(), (p) => p.typeKey, (p) => p.typeLabel);
}

export const getPartsByType = (typeKey: string) =>
  getParts().filter((p) => p.typeKey === typeKey);

export const getPartsByBrand = (brandKey: string) =>
  getParts().filter((p) => p.brandKey === brandKey);

/**
 * Tipovi delova koji za datu marku zaista postoje, sa brojem komada. Od ovoga
 * se na stranici marke sastavlja uvodni pasus — bez izmišljanja, samo ono što
 * je u katalogu. Stranica sa jednom rečenicom i spiskom linkova je za Google
 * „thin content"; ovo joj daje sadržaj koji nijedna druga stranica nema.
 */
export const partTypesForBrand = (brandKey: string): Kategorija[] =>
  prebroj(getPartsByBrand(brandKey), (p) => p.typeKey, (p) => p.typeLabel);

/* ------------------- Ukrštene kategorije: tip × marka ------------------- */

/**
 * Najmanji broj delova da ukrštena strana ima šta da pokaže. Ispod toga to je
 * naslov i tri linka — „thin content" koji Google po pravilu ostavi u
 * „Discovered – currently not indexed", a nama razblažuje kategoriju.
 */
export const MIN_ZA_UKRSTENU = 5;

export type UkrstenaKategorija = {
  tipKey: string;
  tipLabel: string;
  brendKey: string;
  brendLabel: string;
  count: number;
};

let ukrsteneCache: UkrstenaKategorija[] | null = null;

/**
 * Kombinacije tip dela × marka pluga koje zaslužuju svoju stranicu.
 *
 * ZAŠTO: „raonik" i „delovi za Lemken" su dva različita upita i oba već imaju
 * svoju stranu, ali kupac najčešće kuca treći — „raonik za Lemken plug". Za taj
 * upit do sada nije postojala nijedna strana na kojoj su baš ta dva pojma u
 * naslovu; Google je nudio širu kategoriju, koja gubi od konkurencije sa
 * preciznim naslovom. Univerzalni delovi se preskaču — „raonik za univerzalno"
 * nije upit.
 */
export function partTypeBrandPairs(): UkrstenaKategorija[] {
  if (ukrsteneCache) return ukrsteneCache;

  const mapa = new Map<string, UkrstenaKategorija>();
  for (const p of getParts()) {
    if (!p.typeKey || !p.brandKey || p.brandKey === "univerzalno") continue;
    const kljuc = `${p.typeKey}|${p.brandKey}`;
    const postojeci = mapa.get(kljuc);
    if (postojeci) {
      postojeci.count += 1;
      continue;
    }
    mapa.set(kljuc, {
      tipKey: p.typeKey,
      tipLabel: p.typeLabel ?? p.typeKey,
      brendKey: p.brandKey,
      brendLabel: p.brandLabel ?? p.brandKey,
      count: 1,
    });
  }

  ukrsteneCache = [...mapa.values()]
    .filter((u) => u.count >= MIN_ZA_UKRSTENU)
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.tipLabel.localeCompare(b.tipLabel, "sr") ||
        a.brendLabel.localeCompare(b.brendLabel, "sr"),
    );
  return ukrsteneCache;
}

export const getPartsByTypeAndBrand = (tipKey: string, brendKey: string): Product[] =>
  getParts().filter((p) => p.typeKey === tipKey && p.brandKey === brendKey);

/** Marke za koje dati tip dela ima svoju ukrštenu stranu — za unutrašnje linkove. */
export const brandsForPartType = (tipKey: string): Kategorija[] =>
  partTypeBrandPairs()
    .filter((u) => u.tipKey === tipKey)
    .map((u) => ({ key: u.brendKey, label: u.brendLabel, count: u.count }));

/** Tipovi delova za koje data marka ima svoju ukrštenu stranu. */
export const partTypesWithPageForBrand = (brendKey: string): Kategorija[] =>
  partTypeBrandPairs()
    .filter((u) => u.brendKey === brendKey)
    .map((u) => ({ key: u.tipKey, label: u.tipLabel, count: u.count }));

/** Adresa ukrštene strane; `null` kad za tu kombinaciju strana ne postoji. */
export function ukrstenaHref(tipKey?: string, brendKey?: string): string | null {
  if (!tipKey || !brendKey) return null;
  const ima = partTypeBrandPairs().some(
    (u) => u.tipKey === tipKey && u.brendKey === brendKey,
  );
  return ima ? `/delovi/${tipKey}/${brendKey}` : null;
}

export const getMachinesByCategory = (typeKey: string) =>
  getMachines().filter((p) => p.typeKey === typeKey);

/** Sve mašine jedne grane, bez obzira na tip — za stranicu grane. */
export const getMachinesByBranch = (granaKey: string) =>
  getMachines().filter((p) => p.granaKey === granaKey);

/** Radi i za program prikolica („light") i za grupu opreme („oprema-cerade"). */
export const getTrailersByType = (typeKey: string) =>
  build().all.filter(
    (p) => (p.kind === "prikolica" || p.kind === "oprema") && p.typeKey === typeKey,
  );

/** Koliko proizvoda ide na jednu stranu kataloškog indeksa. */
export const KATALOG_PO_STRANI = 120;

export function katalogBrojStrana(): number {
  return Math.max(1, Math.ceil(getAllProducts().length / KATALOG_PO_STRANI));
}

export function katalogStrana(strana: number): Product[] {
  const start = (strana - 1) * KATALOG_PO_STRANI;
  return getAllProducts().slice(start, start + KATALOG_PO_STRANI);
}
