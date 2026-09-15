import type { Metadata, Viewport } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/FloatingContact";
import { site } from "@/lib/site";

// Fontovi sa podrškom za srpsku latinicu (č, ć, š, ž, đ) → subset "latin-ext"
// Sora = premium, samouveren grotesque za naslove; Inter = vrhunska čitljivost za tekst.
const display = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = "https://plugeks.com";

/**
 * Naslov i opis početne su ono što Google ispisuje uz rezultat za „plugeks":
 * prva rečenica opisa je i prva rečenica koju posetilac pročita o firmi, pa
 * stoji ono čime se firma bavi — „Uvoz i prodaja poljoprivrednih delova i
 * mašina" — a ne spisak kategorija sa brojkama.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PlugekS — Uvoz i prodaja poljoprivrednih delova i mašina",
    template: "%s | PlugekS",
  },
  description:
    "Uvoz i prodaja poljoprivrednih delova i mašina. Rezervni delovi za plugove, roto drljače, tanjirače i sejalice, poljoprivredne, šumske i građevinske mašine i auto-prikolice. Isporuka širom Srbije. Žabalj, Vojvodina.",
  keywords: [
    "poljoprivredni delovi",
    "rezervni delovi za plugove",
    "delovi za roto drljače",
    "noževi za freze",
    "diskovi za tanjirače",
    "S-opruge za setvospremače",
    "poljoprivredne mašine",
    "poljoprivredna mehanizacija",
    "malčeri",
    "freze",
    "plugovi",
    "tanjirača",
    "auto prikolice",
    "prikolica za auto",
    "prikolica 750 kg",
    "prikolica za čamac",
    "prikolica za motor",
    "prikolica za transport vozila",
    "subvencije poljoprivreda",
    "Žabalj",
    "Vojvodina",
    "PlugekS",
  ],
  authors: [{ name: "PlugekS" }],
  /**
   * NI `canonical` NI `openGraph.url` ne smeju da stoje ovde.
   *
   * Next nasleđuje oba polja na svaku stranu koja ih sama ne postavi, pa su
   * `/o-nama`, `/kontakt`, `/zatrazi-ponudu` i `/subvencije-i-finansiranje`
   * Google-u govorile „ja sam duplikat početne, ne indeksiraj me", a sve ostale
   * strane su uz svoj sadržaj prijavljivale adresu početne. Početna svoj
   * canonical i og:url sada postavlja sama (`src/app/page.tsx`).
   */
  openGraph: {
    type: "website",
    locale: "sr_RS",
    siteName: "PlugekS",
    title: "PlugekS — Uvoz i prodaja poljoprivrednih delova i mašina",
    description:
      "Rezervni delovi za plugove i roto drljače, poljoprivredne, šumske i građevinske mašine i auto-prikolice — uz finansiranje, podršku oko subvencija i isporuku širom Srbije i regiona.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "PlugekS — uvoz i prodaja poljoprivrednih delova i mašina" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlugekS — Uvoz i prodaja poljoprivrednih delova i mašina",
    description:
      "Rezervni delovi za plugove i roto drljače, poljoprivredne mašine i auto-prikolice uz finansiranje i isporuku širom Srbije.",
    images: ["/og.jpg"],
  },
  /**
   * `max-image-preview: "large"` je ono čime se Google-u dozvoljava da uz
   * rezultat prikaže VELIKU sliku. Bez te direktive vredi podrazumevano
   * „standard" — sitna sličica ili nijedna — pa je crtež dela, i kad je uredno
   * prijavljen, u rezultatima gubio od logoa koji stoji na svakoj strani.
   *
   * `max-snippet: -1` i `max-video-preview: -1` skidaju isto takva ograničenja
   * sa dužine opisa i video pregleda; idu zajedno jer ih Google čita kao jedan
   * skup. `googleBot` ponavlja isto zato što specifičnije pravilo za tog
   * robota gasi ono opšte ako se razlikuju.
   */
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#1B5E20",
  width: "device-width",
  initialScale: 1,
};

/**
 * WebSite + SearchAction — uz rezultat za „plugeks" Google ume da prikaže i polje
 * za pretragu koje vodi pravo u naš katalog, umesto da posetilac prvo otvori
 * početnu pa traži odatle. `@id` je odvojen od `Store` entiteta, a `publisher`
 * ih povezuje u jedan graf.
 */
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: site.name,
  alternateName: ["Plugeks", "PLUGEKS"],
  inLanguage: "sr-RS",
  publisher: { "@id": `${SITE_URL}/#plugeks` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/proizvodi?vrsta=delovi&q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className={`${display.variable} ${sans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <FloatingContact />
      </body>
    </html>
  );
}
