/**
 * Sadržaj sajta — proizvodi, kategorije, prednosti, utisci, statistika.
 *
 * KAKO DA ZAMENIŠ PRAVE PODATKE:
 *  - Proizvode (cene/specifikacije/nazive) menjaš u nizu `products`.
 *  - `tone` određuje boju premium placeholder slike. Kad imaš pravu fotografiju,
 *    vidi README → "Zamena placeholder slika pravim fotografijama".
 *  - Utiske kupaca u `testimonials`, brojke poverenja u `stats`.
 */

import type { LucideIcon } from "lucide-react";
import {
  Scissors,
  Cog,
  Forklift,
  Tractor,
  Layers,
  Wrench,
  Banknote,
  ShieldCheck,
  Truck,
  Headset,
  BadgeCheck,
  Landmark,
} from "lucide-react";

/* ---------------------------------- Kategorije ---------------------------------- */

export type CategoryKey =
  | "malceri"
  | "freze"
  | "utovarivaci"
  | "traktori"
  | "prikljucne"
  | "delovi";

export type Category = {
  key: CategoryKey;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  tone: ImageTone;
  image: string; // ZAMENI: prava fotografija (/public/images/...)
};

export type ImageTone = "field" | "forest" | "soil" | "steel" | "harvest";

export const categories: Category[] = [
  {
    key: "malceri",
    label: "Malčeri",
    short: "Malčeri / Mulčeri",
    description:
      "Mašine za usitnjavanje rastinja, žetvenih ostataka i šiblja. Hidrauličko podešavanje, kaljeni noževi i robusna konstrukcija za svakodnevni rad.",
    icon: Scissors,
    tone: "field",
    image: "/images/malceri.jpg",
  },
  {
    key: "freze",
    label: "Freze",
    short: "Rotacione freze",
    description:
      "Priprema zemljišta u jednom prohodu — usitnjavanje i prevrtanje za savršenu setvenu osnovu.",
    icon: Cog,
    tone: "soil",
    image: "/images/freze.jpg",
  },
  {
    key: "utovarivaci",
    label: "Prednji utovarivači",
    short: "Prednji utovarivači",
    description:
      "Utovarivači za sve veličine traktora — utovar, manipulacija i transport bez gubitka vremena.",
    icon: Forklift,
    tone: "steel",
    image: "/images/utovarivaci.jpg",
  },
  {
    key: "traktori",
    label: "Kompakt traktori",
    short: "Kompakt traktori",
    description:
      "Pouzdani kompakt traktori za voćnjake, plastenike, dvorišta i komunalne radove.",
    icon: Tractor,
    tone: "harvest",
    image: "/images/traktori.jpg",
  },
  {
    key: "prikljucne",
    label: "Priključne mašine",
    short: "Priključci",
    description:
      "Tanjirače, kosačice i priključci koji proširuju mogućnosti vašeg traktora.",
    icon: Layers,
    tone: "field",
    image: "/images/prikljucne.jpg",
  },
  {
    key: "delovi",
    label: "Rezervni delovi",
    short: "Rezervni delovi",
    description:
      "Originalni i kompatibilni rezervni delovi — brza isporuka i stručna pomoć pri izboru.",
    icon: Wrench,
    tone: "steel",
    image: "/images/delovi.jpg",
  },
];

export const categoryLabel = (key: CategoryKey) =>
  categories.find((c) => c.key === key)?.label ?? key;

/* ---------------------------------- Proizvodi ---------------------------------- */

export type Spec = { label: string; value: string };

export type Product = {
  id: string;
  name: string;
  category: CategoryKey;
  tagline: string;
  description: string;
  specs: Spec[];
  highlights: string[];
  badge?: string; // npr. "Akcija", "Najprodavanije"
  popular?: boolean;
  tone: ImageTone;
};

// ZAMENI: prave nazive, specifikacije i fotografije proizvoda iz vašeg asortimana.
// NT/VT modeli su primeri iz audita — proveri tačne vrednosti pre objave.
export const products: Product[] = [
  {
    id: "malcer-nt-4-0",
    name: "Malčer NT-4.0",
    category: "malceri",
    tagline: "Kompaktan malčer za voćnjake i međuredni prostor",
    description:
      "Lagana ali izdržljiva mašina idealna za voćnjake, vinograde i uže parcele. Hidrauličko podešavanje dubine i pomeranje sa strane omogućavaju rad uz same redove.",
    specs: [
      { label: "Radni zahvat", value: "1,40 m" },
      { label: "Broj noževa", value: "16 čekić-noževa" },
      { label: "Podešavanje dubine", value: "Hidrauličko" },
      { label: "Preporučena snaga", value: "od 35 KS" },
    ],
    highlights: ["Bočni hidraulični pomak", "Kaljeni noževi", "Pojačan rotor"],
    badge: "Najprodavanije",
    popular: true,
    tone: "field",
  },
  {
    id: "malcer-vt-5-0",
    name: "Malčer VT-5.0",
    category: "malceri",
    tagline: "Univerzalni malčer za ratarstvo i održavanje",
    description:
      "Sredina ponude — odnos snage, zahvata i cene koji najbolje odgovara većini gazdinstava. Pogodan za žetvene ostatke, travu i sitnije šiblje.",
    specs: [
      { label: "Radni zahvat", value: "1,75 m" },
      { label: "Broj noževa", value: "20 čekić-noževa" },
      { label: "Podešavanje dubine", value: "Hidrauličko" },
      { label: "Preporučena snaga", value: "od 50 KS" },
    ],
    highlights: ["Dupli kaiš pogon", "Valjak za kopiranje terena", "Zaštita reduktora"],
    popular: true,
    tone: "harvest",
  },
  {
    id: "malcer-vt-7-0",
    name: "Malčer VT-7.0",
    category: "malceri",
    tagline: "Malčer visokog učinka za velike površine",
    description:
      "Najjači u seriji — projektovan za intenzivan rad i velike parcele. Veliki radni zahvat i pojačana konstrukcija znače veću efikasnost i dug vek trajanja.",
    specs: [
      { label: "Radni zahvat", value: "2,00 m" },
      { label: "Broj noževa", value: "24 čekić-noža" },
      { label: "Podešavanje dubine", value: "Hidrauličko" },
      { label: "Preporučena snaga", value: "od 70 KS" },
    ],
    highlights: ["Visok učinak", "Robusno kućište", "Dug radni vek"],
    badge: "Akcija",
    tone: "field",
  },
  {
    id: "freza-rotaciona-180",
    name: "Rotaciona freza 1.80",
    category: "freze",
    tagline: "Priprema zemljišta u jednom prohodu",
    description:
      "Snažna rotaciona freza za pripremu setvene osnove. Usitnjava i prevrće zemljište do željene dubine, ostavljajući ravan i rastresit profil.",
    specs: [
      { label: "Radni zahvat", value: "1,80 m" },
      { label: "Broj noževa", value: "48 zakrivljenih noževa" },
      { label: "Dubina obrade", value: "do 18 cm" },
      { label: "Preporučena snaga", value: "od 45 KS" },
    ],
    highlights: ["Bočni prenos lancem", "Podesiva zadnja klapna", "Sigurnosna kvačila"],
    tone: "soil",
  },
  {
    id: "freza-laka-125",
    name: "Laka freza 1.25",
    category: "freze",
    tagline: "Za bašte, plastenike i kompakt traktore",
    description:
      "Kompaktna freza za manje traktore, plastenike i povrtarstvo. Lako se kači i daje finu strukturu zemljišta.",
    specs: [
      { label: "Radni zahvat", value: "1,25 m" },
      { label: "Broj noževa", value: "36 noževa" },
      { label: "Dubina obrade", value: "do 15 cm" },
      { label: "Preporučena snaga", value: "od 25 KS" },
    ],
    highlights: ["Mala masa", "Centralni prenos", "Idealna za plastenike"],
    tone: "field",
  },
  {
    id: "utovarivac-fl-premium",
    name: "Prednji utovarivač FL Premium",
    category: "utovarivaci",
    tagline: "Brza montaža i demontaža, za sve veličine traktora",
    description:
      "Univerzalni prednji utovarivač sa euro-prihvatom za dodatke. Hidraulično paralelno vođenje i euro-ploča omogućavaju brzu zamenu kašike, vila i drugih alata.",
    specs: [
      { label: "Visina dizanja", value: "do 3,4 m" },
      { label: "Nosivost", value: "do 1.200 kg" },
      { label: "Prihvat", value: "Euro-ploča" },
      { label: "Montaža", value: "Brza (quick-coupler)" },
    ],
    highlights: ["Euro-prihvat dodataka", "Paralelno vođenje", "Joystick komanda"],
    popular: true,
    tone: "steel",
  },
  {
    id: "utovarivac-kasika-vile",
    name: "Set: kašika + vile za balu",
    category: "utovarivaci",
    tagline: "Dodaci koji proširuju mogućnosti utovarivača",
    description:
      "Komplet dodataka sa euro-prihvatom — kašika za rasuti teret i vile za bale. Brza zamena bez alata.",
    specs: [
      { label: "Širina kašike", value: "1,80 m" },
      { label: "Prihvat", value: "Euro-ploča" },
      { label: "Materijal", value: "Visokočvrsti čelik" },
      { label: "Kompatibilnost", value: "Svi FL utovarivači" },
    ],
    highlights: ["Brza zamena", "Ojačani zubi", "Univerzalni prihvat"],
    tone: "steel",
  },
  {
    id: "traktor-compact-26",
    name: "Kompakt traktor 26 KS 4x4",
    category: "traktori",
    tagline: "Okretan pogonaš za voćnjake i dvorišta",
    description:
      "Kompaktan traktor sa pogonom na sva četiri točka, idealan za voćnjake, vinograde, plastenike i komunalno održavanje. Mali gabariti, velika upotrebljivost.",
    specs: [
      { label: "Snaga motora", value: "26 KS" },
      { label: "Pogon", value: "4x4" },
      { label: "Priključno vratilo", value: "540 o/min" },
      { label: "Hidraulika", value: "Zadnji troточkasti priključak" },
    ],
    highlights: ["Pogon 4x4", "Servo upravljač", "Niska potrošnja"],
    badge: "Subvencije",
    popular: true,
    tone: "harvest",
  },
  {
    id: "traktor-compact-50",
    name: "Kompakt traktor 50 KS 4x4",
    category: "traktori",
    tagline: "Više snage za zahtevnije radove",
    description:
      "Snažniji kompakt traktor za rad sa malčerom, frezom i utovarivačem. Komforna kabina i pouzdan motor za celodnevni rad.",
    specs: [
      { label: "Snaga motora", value: "50 KS" },
      { label: "Pogon", value: "4x4" },
      { label: "Priključno vratilo", value: "540 / 1000 o/min" },
      { label: "Hidraulika", value: "Pojačana, sa dodatnim izvodima" },
    ],
    highlights: ["Klimatizovana kabina", "Pojačana hidraulika", "Sinhronizovani menjač"],
    tone: "harvest",
  },
  {
    id: "tanjiraca-20",
    name: "Tanjirača 20 diskova",
    category: "prikljucne",
    tagline: "Brza i kvalitetna obrada strništa",
    description:
      "Vučena/nošena tanjirača za obradu strništa i pripremu zemljišta. Nazubljeni diskovi obezbeđuju dobro usitnjavanje i mešanje žetvenih ostataka.",
    specs: [
      { label: "Broj diskova", value: "20" },
      { label: "Radni zahvat", value: "2,20 m" },
      { label: "Prečnik diska", value: "560 mm" },
      { label: "Preporučena snaga", value: "od 60 KS" },
    ],
    highlights: ["Nazubljeni diskovi", "Podesiv ugao", "Robusna rama"],
    tone: "soil",
  },
  {
    id: "kosacica-rotaciona",
    name: "Rotaciona kosačica 1.65",
    category: "prikljucne",
    tagline: "Za košenje livada i zelene mase",
    description:
      "Pouzdana rotaciona kosačica za košenje trave, deteline i livada. Jednostavno održavanje i čist otkos.",
    specs: [
      { label: "Radni zahvat", value: "1,65 m" },
      { label: "Broj diskova", value: "4" },
      { label: "Zaštita", value: "Preklopna greda" },
      { label: "Preporučena snaga", value: "od 40 KS" },
    ],
    highlights: ["Preklopna greda", "Lako održavanje", "Čist otkos"],
    tone: "field",
  },
  {
    id: "delovi-noz-reduktor",
    name: "Rezervni delovi i potrošni materijal",
    category: "delovi",
    tagline: "Noževi, reduktori, kaiševi, ležajevi i više",
    description:
      "Široka ponuda rezervnih delova za malčere, freze i priključke. Pošaljite model mašine — pomažemo da izaberete tačan deo i šaljemo brzo.",
    specs: [
      { label: "Asortiman", value: "Noževi, reduktori, kaiševi" },
      { label: "Dostupnost", value: "Sa lagera i po porudžbini" },
      { label: "Isporuka", value: "Brza, širom Srbije" },
      { label: "Podrška", value: "Stručan izbor delova" },
    ],
    highlights: ["Velika dostupnost", "Brza isporuka", "Stručna pomoć"],
    tone: "steel",
  },
];

export const popularProducts = products.filter((p) => p.popular);

/* ---------------------------------- Zašto PlugekS ---------------------------------- */

export type Advantage = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const advantages: Advantage[] = [
  {
    title: "Finansiranje i krediti",
    description:
      "Saradnja sa bankama i lizing kućama — kupujte mašinu odmah, a plaćajte na rate prilagođene poljoprivredi.",
    icon: Banknote,
  },
  {
    title: "Podrška oko subvencija",
    description:
      "Pomažemo vam da iskoristite državne podsticaje — savetujemo oko prava na subvenciju i potrebne dokumentacije.",
    icon: Landmark,
  },
  {
    title: "Garancija na sve mašine",
    description:
      "Svaka mašina dolazi sa garancijom i obezbeđenim rezervnim delovima — vaša investicija je sigurna.",
    icon: ShieldCheck,
  },
  {
    title: "Brza isporuka širom Srbije",
    description:
      "Dostava mašina i delova na vašu adresu — brzo i pouzdano, u Srbiji i regionu.",
    icon: Truck,
  },
  {
    title: "Stručan savet pre kupovine",
    description:
      "Recite nam traktor i posao — preporučujemo tačno onaj model koji vam najviše vredi za novac.",
    icon: Headset,
  },
  {
    title: "Provereni proizvodi",
    description:
      "Mašine koje prodajemo radimo i prikazujemo u realnim uslovima. Kvalitet koji vidite pre nego što kupite.",
    icon: BadgeCheck,
  },
];

/* ---------------------------------- Statistika / poverenje ---------------------------------- */

// ZAMENI: realne brojke kad ih potvrdiš.
export const stats: { value: string; label: string }[] = [
  { value: "16.000+", label: "pratilaca na Facebook-u" },
  { value: "1.000+", label: "isporučenih mašina" },
  { value: "10+", label: "godina iskustva" },
  { value: "100%", label: "isporuka širom Srbije i regiona" },
];

/* ---------------------------------- Utisci kupaca ---------------------------------- */

export type Testimonial = {
  name: string;
  location: string;
  machine: string;
  quote: string;
};

// ZAMENI: pravim utiscima kupaca (npr. iz fotografija isporuka koje već imate).
export const testimonials: Testimonial[] = [
  {
    name: "Milan J.",
    location: "Bačka Palanka",
    machine: "Malčer VT-5.0",
    quote:
      "Mašina radi besprekorno već drugu sezonu. Isporuka brza, a kad sam zvao za podešavanje — odmah su mi izašli u susret.",
  },
  {
    name: "Dragan S.",
    location: "Ruma",
    machine: "Prednji utovarivač FL Premium",
    quote:
      "Utovarivač mi je dosta ubrzao posao oko bala. Montaža je jednostavna, a euro-prihvat znači da menjam dodatke za par minuta.",
  },
  {
    name: "Zoran M.",
    location: "Bijeljina (BiH)",
    machine: "Kompakt traktor 26 KS 4x4",
    quote:
      "Tražio sam okretan traktor za voćnjak i dobio tačno to. Sve dogovoreno preko telefona, isporuka preko granice bez problema.",
  },
  {
    name: "Nenad P.",
    location: "Šabac",
    machine: "Rotaciona freza 1.80",
    quote:
      "Pomogli su mi i oko papira za subvenciju. Freza ostavlja zemlju kao iz knjige. Preporuka svakom domaćinu.",
  },
];

/* ---------------------------------- FAQ — subvencije/finansiranje ---------------------------------- */

export type Faq = { q: string; a: string };

export const subvencijeFaq: Faq[] = [
  {
    q: "Da li mogu da kupim mašinu preko subvencije?",
    a: "Da. Veliki deo naše mehanizacije može se nabaviti uz korišćenje državnih podsticaja za poljoprivredu. Javite nam model koji vas zanima i savetujemo vas oko prava na subvenciju i potrebne dokumentacije.",
  },
  {
    q: "Kako funkcioniše finansiranje na rate?",
    a: "Sarađujemo sa bankama i lizing kućama, pa mašinu možete preuzeti odmah, a otplaćivati je na rate prilagođene sezoni i prihodima gazdinstva. Pošaljite upit i pripremićemo vam okvirni plan otplate.",
  },
  {
    q: "Koju dokumentaciju je potrebno pripremiti?",
    a: "Zavisi od konkretne mere i načina finansiranja. Najčešće su to dokazi o registrovanom gazdinstvu i osnovni lični/poslovni dokumenti. Provedemo vas kroz ceo proces korak po korak.",
  },
  {
    q: "Da li isporučujete i u region (BiH, Crna Gora)?",
    a: "Da, isporučujemo širom Srbije i u region. Dogovor i isporuku najčešće rešavamo telefonom — kontaktirajte nas za detalje oko transporta i carinskih formalnosti.",
  },
];
