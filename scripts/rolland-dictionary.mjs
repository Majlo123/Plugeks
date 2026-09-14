/**
 * Rečnik za prevod Rolland (PL) kataloga na srpski.
 *
 * Koristi ga `scripts/build-catalog.mjs`. Ako primetiš pogrešan prevod ili
 * nedostajući brend — dopuni ovde i pokreni `npm run catalog` ponovo.
 */

/* --------------------------- Grupe (kategorije) --------------------------- */
// Ključ = slug segment iz rolland.pl URL-a.
// Rolland MAŠINE (plavi program za obradu zemljišta) su skinute sa sajta
// odlukom vlasnika — ostaju samo delovi. Grupa `maszyny-rolniczne` zato više
// nije ovde, a `machines.json` piše isključivo `npm run masine` (Hofman).
export const GROUPS = {
  "czesci-do-plugow": {
    key: "delovi-plugovi",
    type: "delovi",
    label: "Delovi za plugove",
    image: "/images/delovi.jpg",
  },
  "czesci-do-agregatow": {
    key: "delovi-agregati",
    type: "delovi",
    label: "Delovi za agregate i grubere",
    image: "/images/delovi.jpg",
  },
  "czesci-do-bron-talerzowych": {
    key: "delovi-tanjirace",
    type: "delovi",
    label: "Delovi za tanjirače",
    image: "/images/delovi.jpg",
  },
  "czesci-do-siewnikow": {
    key: "delovi-sejalice",
    type: "delovi",
    label: "Delovi za sejalice",
    image: "/images/delovi.jpg",
  },
  "czesci-do-kopaczki": {
    key: "delovi-vadilice",
    type: "delovi",
    label: "Delovi za vadilice krompira",
    image: "/images/delovi.jpg",
  },
  "czesci-do-kosiarki": {
    key: "delovi-kosacice",
    type: "delovi",
    label: "Delovi za kosačice",
    image: "/images/delovi.jpg",
  },
};

/* ------------------------------ Tipovi delova ----------------------------- */
// Prepoznaju se po prvom tokenu slug-a. Redosled nije bitan (tačno poklapanje).
export const PART_TYPES = {
  // Plug
  lemiesz: { key: "lemes", label: "Raonik" },
  odkladnia: { key: "daska", label: "Daska" },
  odkladnica: { key: "daska", label: "Daska" },
  // „Odkładniczka" je daska predplužnjaka — isti deo kao „odkladnia-przedpluzka"
  // (vidi NAME_PREFIXES), pa ide pod isti tip.
  odkladniczka: { key: "daska-predpluznjaka", label: "Daska predplužnjaka" },
  ploza: { key: "plaz", label: "Plaz" },
  piers: { key: "grudi", label: "Grudi daske" },
  listwa: { key: "lajsna", label: "Nastavak daske" },
  dluto: { key: "dleto", label: "Vrh raonika" },
  scinacz: { key: "odsecac", label: "Deflektor" },
  kroj: { key: "crtalo", label: "Crtalo" },
  kroje: { key: "crtalo", label: "Crtalo" },
  nakladka: { key: "obloga", label: "Obloga (nalegač)" },
  korpus: { key: "telo", label: "Plužno telo" },
  uchwyt: { key: "drzac", label: "Držač" },
  grzadziel: { key: "gredelj", label: "Vrat/greda" },
  podstawa: { key: "postolje", label: "Postolje" },
  oslona: { key: "zastita", label: "Zaštita" },
  przod: { key: "prednji-deo", label: "Prednji deo" },
  silownik: { key: "cilindar", label: "Hidraulični cilindar" },
  pietka: { key: "peta", label: "Peta plaza" },
  kolo: { key: "tocak", label: "Točak" },
  zawor: { key: "ventil", label: "Ventil" },
  przedpluzek: { key: "predpluznjak", label: "Predplužnjak" },
  kostka: { key: "kocka", label: "Kocka (odstojnik)" },
  czesc: { key: "ostalo", label: "Ostali delovi" },

  // Agregat / gruber / sejalica
  redlica: { key: "raonik", label: "Raonik (redlica)" },
  dziob: { key: "kljun-raonika", label: "Kljun raonika" },

  // Tanjirača
  talerz: { key: "tanjir", label: "Tanjir (disk)" },

  // Vadilica krompira
  tasma: { key: "traka", label: "Traka elevatora" },
  pret: { key: "sipka", label: "Šipka trake" },
  nit: { key: "zakivak", label: "Zakivak" },
  zawleczka: { key: "rascepka", label: "Rascepka" },
  blaszka: { key: "plocica", label: "Bočna pločica trake" },
  lacznik: { key: "spojnica", label: "Spojnica trake" },
  ogniwo: { key: "karika", label: "Karika" },

  // Kosačica
  trzymak: { key: "drzac-noza", label: "Držač noža" },
};

/* ------------------------ Složeni nazivi (prefiks slug-a) ----------------- */
// Kad slug počinje ovim tokenima, koristi se ovaj naziv umesto osnovnog tipa —
// i, kad je naveden `key`, TAJ TIP za filter. Ranije je tip uvek ostajao
// osnovni (prvi token), pa je „Rešetka/traka daske" stajala pod tipom
// „Nastavak daske", a „Prednji deo plaza" pod „Ostali delovi": naziv na kartici
// i tip u filteru nisu se poklapali, a kupac koji bira „Plaz" nije mogao da
// razdvoji dugi od kratkog. Sad svaki naziv iz ove tabele ima svoj tip.
//
// Prefiks BEZ `key` (npr. „piers-odkladni") samo lepše imenuje osnovni tip.
// Duži prefiksi moraju biti navedeni pre kraćih.
export const NAME_PREFIXES = [
  { prefix: "czesc-przednia-plozy", key: "prednji-deo-plaza", label: "Prednji deo plaza" },
  { prefix: "listwa-odkladnicy", key: "lajsna", label: "Nastavak daske" },
  { prefix: "listwa-azurowa", key: "resetka", label: "Rešetka/traka daske" },
  { prefix: "lemiesz-przedpluzka", key: "raonik-predpluznjaka", label: "Raonik predplužnjaka" },
  { prefix: "odkladnia-przedpluzka", key: "daska-predpluznjaka", label: "Daska predplužnjaka" },
  { prefix: "piers-przedpluzka", key: "grudi-predpluznjaka", label: "Grudi daske predplužnjaka" },
  { prefix: "ploza-przednia", key: "prednji-plaz", label: "Prednji plaz" },
  { prefix: "ploza-dluga", key: "dugi-plaz", label: "Dugi plaz" },
  { prefix: "ploza-krotka", key: "kratki-plaz", label: "Kratki plaz" },
  { prefix: "kroj-plozy", key: "nozasto-crtalo", label: "Nožasto crtalo" },
  { prefix: "nakladka-plozy", key: "obloga-plaza", label: "Obloga plaza" },
  { prefix: "uchwyt-scinacza", key: "nosac-deflektora", label: "Nosač deflektora" },
  { prefix: "piers-odkladni", label: "Grudi daske" },
  { prefix: "czesc-przednia", key: "prednji-deo", label: "Prednji deo" },
];

/* --------------------------------- Brendovi -------------------------------- */
// `match` su tokeni iz slug-a; duži/precizniji obrasci idu prvi.
export const BRANDS = [
  // Složeni brendovi — moraju biti pre pojedinačnih tokena.
  // „Werk” bez „rabe” u slug-u (MU, KU, KSU, GWR serije) je isti proizvođač — Rabe Werk.
  { key: "rabe-werk", label: "Rabewerk", match: ["rabe-werk", "rabe", "werk"] },
  { key: "landsberg-pottinger", label: "Landsberg / Pöttinger", match: ["landsberg-pottinger"] },
  { key: "dowdeswell-ransomes", label: "Dowdeswell / Ransomes", match: ["dowdeswell-ransomes"] },
  { key: "agrolux-fiskars", label: "Agrolux / Fiskars", match: ["agrolux-fiskars"] },
  { key: "kongskilde", label: "Kongskilde", match: ["kongskilde-skjold"] },

  { key: "kuhn-huard", label: "Kuhn / Huard", match: ["kuhn-huard", "kuhn", "huard"] },
  { key: "vogel-noot", label: "Vogel & Noot", match: ["vogel-noot", "vogelnoot", "vogel"] },
  { key: "gregoire-besson", label: "Grégoire-Besson", match: ["gregoire-besson", "gregoire", "besson"] },
  { key: "unia-grudziadz", label: "Unia Grudziądz", match: ["unia-grudziadz", "grudziadz", "unia"] },
  { key: "souchu-pinet", label: "Souchu-Pinet", match: ["souchu-pinet", "souchu", "pinet"] },
  { key: "van-lengerich", label: "Van Lengerich", match: ["van-lengerich", "lengerich"] },
  { key: "case-ih", label: "Case IH / International", match: ["case-international", "case-ih", "case", "international"] },
  { key: "john-deere", label: "John Deere", match: ["john-deere", "deere"] },
  { key: "kongskilde", label: "Kongskilde", match: ["kongskilde", "skjold"] },
  { key: "lemken", label: "Lemken", match: ["lemken"] },
  { key: "niemeyer", label: "Niemeyer", match: ["niemeyer"] },
  { key: "gassner", label: "Gassner", match: ["gassner"] },
  { key: "pottinger", label: "Pöttinger", match: ["pottinger"] },
  { key: "landsberg", label: "Landsberg", match: ["landsberg"] },
  { key: "krone", label: "Krone", match: ["krone"] },
  { key: "overum", label: "Överum", match: ["overum"] },
  { key: "eberhardt", label: "Eberhardt", match: ["eberhardt"] },
  { key: "kverneland", label: "Kverneland", match: ["kverneland"] },
  { key: "regent", label: "Regent", match: ["regent"] },
  { key: "frost", label: "Frost", match: ["frost"] },
  { key: "brenig", label: "Brenig", match: ["brenig"] },
  { key: "goizin", label: "Goizin", match: ["goizin"] },
  { key: "ransomes", label: "Ransomes", match: ["ransomes"] },
  { key: "dowdeswell", label: "Dowdeswell", match: ["dowdeswell"] },
  { key: "rumptstad", label: "Rumptstad", match: ["rumptstad"] },
  { key: "demblon", label: "Demblon", match: ["demblon"] },
  { key: "duro", label: "Duro", match: ["duro"] },
  { key: "muller", label: "Müller", match: ["muller"] },
  { key: "fenet", label: "Fenet", match: ["fenet"] },
  { key: "heger", label: "Heger", match: ["heger"] },
  { key: "naud", label: "Naud", match: ["naud"] },
  { key: "goudland", label: "Goudland", match: ["goudland"] },
  { key: "kyllingstad", label: "Kyllingstad", match: ["kyllingstad"] },
  { key: "steeno", label: "Steeno", match: ["steeno"] },
  { key: "fiskars", label: "Fiskars", match: ["fiskars"] },
  { key: "bovlund", label: "Bovlund", match: ["bovlund"] },
  { key: "agrolux", label: "Agrolux", match: ["agrolux"] },
  { key: "fraugde", label: "Fraugde", match: ["fraugde"] },
  { key: "thieme", label: "Thieme", match: ["thieme"] },
  { key: "fella", label: "Fella", match: ["fella"] },
  { key: "knecht", label: "Knecht", match: ["knecht"] },
  { key: "bonnel", label: "Bonnel", match: ["bonnel"] },
  { key: "ventzki", label: "Ventzki", match: ["ventzki"] },
  { key: "rower", label: "Rower", match: ["rower"] },
  { key: "agrozet", label: "Agrozet", match: ["agrozet"] },
  { key: "ross", label: "Ross", match: ["ross"] },
  { key: "brix", label: "Brix", match: ["brix"] },
  { key: "sukov", label: "Sukov", match: ["sukov"] },
  { key: "akpil", label: "Akpil", match: ["akpil"] },
  { key: "bugnot", label: "Bugnot", match: ["bugnot"] },
  { key: "baeke", label: "Baeke", match: ["baeke"] },
  { key: "famarol", label: "Famarol", match: ["famarol"] },
  { key: "ermo", label: "Ermo", match: ["ermo"] },
  { key: "cappon", label: "Cappon", match: ["cappon"] },
  { key: "fortschritt", label: "Fortschritt", match: ["fortschritt"] },
  { key: "helwig", label: "Helwig", match: ["helwig"] },
  { key: "maschio", label: "Maschio", match: ["maschio"] },
  { key: "viaud", label: "Viaud", match: ["viaud"] },
  { key: "joutel", label: "Joutel", match: ["joutel"] },
  { key: "ebra", label: "Ebra", match: ["ebra"] },
  { key: "agro-masz", label: "Agro-Masz", match: ["agro-masz"] },
  { key: "moro-aratri", label: "Moro Aratri", match: ["moro-pietro", "moro"] },
  { key: "fermstal-dynow", label: "Fermstal Dynów", match: ["fermstal-dynow", "fermstal"] },
  { key: "althaus", label: "Althaus", match: ["althaus"] },
  { key: "ovlac", label: "Ovlac", match: ["ovlac"] },
  { key: "howard", label: "Howard", match: ["howard"] },
  { key: "charlier", label: "Charlier", match: ["charlier"] },
  { key: "menzi", label: "Menzi", match: ["menzi"] },
  { key: "ibis", label: "Ibis", match: ["ibis"] },
  { key: "rolland", label: "Rolland", match: ["rolland"] },
];

/** Očigledne greške u kucanju na izvornom sajtu → kanonski token. */
export const TOKEN_FIXES = {
  skojold: "skjold",
  venztki: "ventzki",
  vogelnoot: "vogel",
};

/* ------------------------------- Strana ugradnje ------------------------------ */
// `label` je za filter, `suffix` se dodaje na kraj naziva (rodno neutralno,
// jer se odnosi na „Raonik” (m), „Daska” (ž) i „Grudi” (mn.) podjednako).
export const SIDES = {
  lewy: { key: "levi", label: "Levi", suffix: "levo" },
  lewa: { key: "levi", label: "Levi", suffix: "levo" },
  lewe: { key: "levi", label: "Levi", suffix: "levo" },
  prawy: { key: "desni", label: "Desni", suffix: "desno" },
  prawa: { key: "desni", label: "Desni", suffix: "desno" },
  prawe: { key: "desni", label: "Desni", suffix: "desno" },
};

/* ------------------------- Opisni pridevi u nazivu ------------------------ */
// Prevode se i ostaju u nazivu proizvoda; ne postaju filteri.
export const DESCRIPTORS = {
  azurowa: "ažurna",
  azurowy: "ažurni",
  dluga: "duga",
  dlugi: "dugi",
  krotka: "kratka",
  krotki: "kratki",
  przednia: "prednja",
  przedni: "prednji",
  tylna: "zadnja",
  tylny: "zadnji",
  gladka: "glatka",
  wzmocniona: "ojačana",
  podcinajacy: "podsecajući",
  sercowa: "srcasta",
  talerzowa: "tanjirasta",
  zabkowany: "nazubljeni",
  podwojny: "dupli",
  boczna: "bočna",
  elewatorowej: "elevatorske vadilice",
  kopaczki: "vadilice",
  tasmy: "trake",
  plozy: "plaza",
  ploza: "plaza",
  odkladnicy: "daske",
  odkladni: "daske",
  grzadziela: "gredelja",
  redlicy: "raonika",
  noza: "noža",
  scinacza: "deflektora",
  przedpluzka: "predplužnjaka",
  gruber: "gruber",
  do: "za",
  lemiesza: "raonika",
  dluta: "vrha raonika",
  kroju: "crtala",
  korpusu: "plužnog tela",
  pluga: "pluga",
  nozowy: "nožni",
  rosyjski: "ruski",
  czeski: "češki",
  niemiecki: "nemački",
  wloski: "italijanski",
  uniwersalny: "univerzalni",
  uniwersalna: "univerzalna",
};
