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
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: SITE_URL,
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
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1B5E20",
  width: "device-width",
  initialScale: 1,
};

// Structured data: LocalBusiness (lokalni SEO)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  // Stabilan @id — vezuje sve pominjanje firme za jedan entitet.
  "@id": `${SITE_URL}/#plugeks`,
  name: site.name,
  // Ljudi kucaju "plugeks", ne "PlugekS".
  alternateName: ["Plugeks", "PLUGEKS"],
  description: site.description,
  url: SITE_URL,
  telephone: site.phoneIntl,
  email: site.email,
  image: `${SITE_URL}/og.jpg`,
  logo: `${SITE_URL}/images/logo-full.png`,
  priceRange: "$$",
  currenciesAccepted: "RSD",
  areaServed: { "@type": "Country", name: "Srbija" },
  slogan: site.slogan,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    postalCode: site.address.postalCode,
    addressRegion: site.address.region,
    addressCountry: "RS",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: site.address.lat,
    longitude: site.address.lng,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "17:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "08:00",
      closes: "13:00",
    },
  ],
  // Google Business profil ide OVDE zato što Google njime najpouzdanije
  // potvrđuje da su sajt i Maps-listing ista firma — to je entitet koji već
  // ima recenzije i NAP podatke, pa je najjači link u ovom nizu, ne samo još
  // jedna društvena mreža.
  sameAs: [
    site.socials.facebook,
    site.socials.instagram,
    site.socials.tiktok,
    site.socials.googleBusiness,
  ],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
