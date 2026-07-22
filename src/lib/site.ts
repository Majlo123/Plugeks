/**
 * JEDAN IZVOR ISTINE za sve kontakt podatke, linkove i NAP informacije.
 * ZAMENI vrednosti ovde kad se nešto promeni — menja se na celom sajtu.
 */

export const site = {
  name: "PlugekS",
  legalName: "PlugekS",
  slogan: "Napredna poljoprivreda",
  description:
    "Uvoz i prodaja poljoprivredne mehanizacije i delova — malčeri, freze, prednji utovarivači, kompakt traktori i priključne mašine. Žabalj, Vojvodina.",

  // Kontakt (NAP — Name / Address / Phone)
  phoneDisplay: "062 194 8387",
  phoneIntl: "+381621948387", // za tel: i wa.me linkove
  email: "plugeks@gmail.com",

  address: {
    street: "Žabalj",
    city: "Žabalj",
    postalCode: "21230",
    region: "Vojvodina",
    country: "Srbija",
    full: "Žabalj 21230, Vojvodina, Srbija",
    // ZAMENI: prave koordinate firme za precizan pin na mapi
    lat: 45.3722,
    lng: 20.0686,
  },

  hours: [
    { day: "Ponedeljak – Petak", time: "08:00 – 17:00" },
    { day: "Subota", time: "08:00 – 13:00" },
    { day: "Nedelja", time: "Zatvoreno" },
  ],

  // Linkovi ka mrežama (iz audita)
  socials: {
    facebook: "https://www.facebook.com/p/PlugekS-100077726130337/",
    instagram: "https://www.instagram.com/plugeks/",
    website: "https://plugeks.rs",
  },

  // Brzi linkovi za komunikaciju
  get telHref() {
    return `tel:${this.phoneIntl}`;
  },
  get whatsappHref() {
    const msg = encodeURIComponent(
      "Poštovani, zanima me ponuda za poljoprivrednu mehanizaciju.",
    );
    return `https://wa.me/${this.phoneIntl.replace("+", "")}?text=${msg}`;
  },
  get viberHref() {
    return `viber://chat?number=${this.phoneIntl}`;
  },
  get mailHref() {
    return `mailto:${this.email}`;
  },
} as const;

export type NavItem = { label: string; href: string };

export const nav: NavItem[] = [
  { label: "Proizvodi", href: "/proizvodi" },
  { label: "Subvencije i finansiranje", href: "/subvencije-i-finansiranje" },
  { label: "O nama", href: "/o-nama" },
  { label: "Kontakt", href: "/kontakt" },
];
