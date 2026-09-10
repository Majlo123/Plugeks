/**
 * Sadržaj sajta — kategorije asortimana, prednosti, utisci, statistika.
 *
 * Sami proizvodi (mašine i delovi) NISU ovde — dolaze iz Rolland kataloga,
 * vidi `src/lib/catalog.ts` i `npm run catalog`.
 *
 * KAKO DA ZAMENIŠ PRAVE PODATKE:
 *  - `tone` određuje boju premium placeholder slike. Kad imaš pravu fotografiju,
 *    vidi README → "Zamena placeholder slika pravim fotografijama".
 *  - Utiske kupaca u `testimonials`, brojke poverenja u `stats`.
 */

import type { LucideIcon } from "lucide-react";
import {
  Scissors,
  Caravan,
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

/**
 * Kartice asortimana na početnoj i u futeru.
 *
 * Tri prve su GRANE mašina (vidi `lib/masine.ts` i `machine-groups.json`), ne
 * pojedinačni tipovi. Ranije su ovde stajale četiri Rolland podgrupe
 * (tanjirače, agregati, podrivači, valjci) — sa 87 mašina u 21 tipu to više
 * nije podela nego uzorak, pa se sada bira posao (njiva / šuma / gradilište),
 * a tip mašine tek unutar grane.
 *
 * Ključevi grana moraju da odgovaraju `grana` vrednostima iz
 * `src/data/machines.json`; „prikolice" i „delovi" su svoje grane sajta.
 */
export type CategoryKey =
  | "poljoprivredne"
  | "sumske"
  | "gradjevinske"
  | "prikolice"
  | "delovi";

export type Category = {
  key: CategoryKey;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  tone: ImageTone;
  image: string;
};

export type ImageTone = "field" | "forest" | "soil" | "steel" | "harvest";

/**
 * Slike kategorija žive u `public/images/kategorije/` (900x563, 16:10, bela
 * podloga) i nisu mockup — to su isečci PRAVIH Rolland rendera naših mašina
 * (čiste verzije iz git istorije `public/images/rolland/`: 4394 Field Hawk BH,
 * 4703 Grander AB, 4705 Deeper GB-325, 4396 valjak sa Field BT), a „Rezervni
 * delovi" je mreža 2x2 Molbro crteža iz `public/images/plugovi/`.
 */
export const categories: Category[] = [
  {
    key: "poljoprivredne",
    label: "Poljoprivredne mašine",
    short: "Poljoprivredne",
    description:
      "Tanjirače, agregati i podrivači, plugovi, malčeri i freze, kosačice i balirke, sejalice, prskalice, prikolice i mešaone — sve za rad na gazdinstvu.",
    icon: Tractor,
    tone: "field",
    image: "/images/kategorije/poljoprivredne.jpg",
  },
  {
    key: "sumske",
    label: "Šumske mašine",
    short: "Šumske",
    description:
      "Cepači drva na kardanski, električni i benzinski pogon, iverači, kružne pile, šumske prikolice i klešta za trupce.",
    icon: Scissors,
    tone: "forest",
    image: "/images/kategorije/sumske.jpg",
  },
  {
    key: "gradjevinske",
    label: "Građevinske mašine",
    short: "Građevinske",
    description:
      "Mini bageri, mini utovarivači i dumperi guseničari — za iskope, zemljane radove i uređenje terena tamo gde velika mašina ne prolazi.",
    icon: Layers,
    tone: "steel",
    image: "/images/kategorije/gradjevinske.jpg",
  },
  {
    key: "prikolice",
    label: "Auto-prikolice",
    short: "Auto-prikolice",
    description:
      "Osam programa od 500 do 3500 kg — otvorene prikolice i platforme, za prevoz vozila, građevinskih mašina, plovila i motocikala. Uz njih i dodatna oprema.",
    icon: Caravan,
    tone: "steel",
    image: "/images/kategorije/prikolice.jpg",
  },
  {
    key: "delovi",
    label: "Rezervni delovi",
    short: "Rezervni delovi",
    description:
      "Preko 4.600 delova za plugove, agregate, tanjirače, sejalice i vadilice — Lemken, Kuhn, Kverneland, Rabe, Pöttinger i drugi.",
    icon: Wrench,
    tone: "steel",
    image: "/images/kategorije/delovi.jpg",
  },
];

export const categoryLabel = (key: CategoryKey) =>
  categories.find((c) => c.key === key)?.label ?? key;

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
    title: "Garancija",
    description:
      "Uz proizvod ide garancija i obezbeđeni rezervni delovi — vaša investicija je sigurna.",
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
    machine: "Tanjirača Field BT",
    quote:
      "Mašina radi besprekorno već drugu sezonu. Isporuka brza, a kad sam zvao za podešavanje — odmah su mi izašli u susret.",
  },
  {
    name: "Dragan S.",
    location: "Ruma",
    machine: "Tanjirasti agregat Field AT",
    quote:
      "Agregat mi je dosta ubrzao pripremu njive — u jednom prohodu dobijem setvenu osnovu za koju sam ranije išao dva puta.",
  },
  {
    name: "Zoran M.",
    location: "Bijeljina (BiH)",
    machine: "Podrivač Deeper GBK \"Kret\"",
    quote:
      "Godinama sam imao problem sa tabanom pluga. Posle podrivača se vidi razlika već prve sezone. Sve dogovoreno telefonom, isporuka preko granice bez problema.",
  },
  {
    name: "Nenad P.",
    location: "Šabac",
    machine: "Bezoranični agregat Grander AB",
    quote:
      "Pomogli su mi i oko papira za subvenciju. Agregat ostavlja zemlju kao iz knjige. Preporuka svakom domaćinu.",
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
