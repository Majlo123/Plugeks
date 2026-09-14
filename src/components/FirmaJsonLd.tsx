import { site } from "@/lib/site";

const SITE_URL = "https://plugeks.com";

/**
 * Structured data o samoj firmi (`Store` — lokalni SEO, Google Business,
 * knowledge panel).
 *
 * ZAŠTO JE IZDVOJENO IZ `layout.tsx`: node je ranije stajao na SVAKOJ strani, a
 * nosi `image` — sliku koja predstavlja subjekat strane. Na 5.000+ strana
 * proizvoda je to Google-u značilo „slika ove strane je logo PlugekS-a", uz
 * `Product.image` koji u istom grafu tvrdi da je slika crtež dela. Dva
 * suprotna tvrđenja, a logo ih je imao 5.000 puta više.
 *
 * Zato node ide SAMO tamo gde je firma zaista tema strane — početna, „O nama"
 * i „Kontakt". Sve ostale strane firmu i dalje pominju, ali preko `@id`
 * reference (vidi `WebSite.publisher` u `layout.tsx` i `Product.offers.seller`
 * na strani proizvoda), što Google razrešava kroz ceo sajt bez ponavljanja slike.
 *
 * `image` je fotografija firme u radu, ne logo: Google za `image` traži sliku
 * subjekta, a logo ima svoje polje (`logo`) i odatle ide u knowledge panel.
 */
const firmaJsonLd = {
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
  image: `${SITE_URL}/images/galerija-3.jpg`,
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

export function FirmaJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(firmaJsonLd) }}
    />
  );
}
