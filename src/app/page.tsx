import { Hero } from "@/components/sections/Hero";
import { UspBar } from "@/components/sections/UspBar";
import { Kategorije } from "@/components/sections/Kategorije";
import { ProizvodiPreview } from "@/components/sections/ProizvodiPreview";
import { DeloviPreview } from "@/components/sections/DeloviPreview";
import { PrikolicePreview } from "@/components/sections/PrikolicePreview";
import { Akcije } from "@/components/sections/Akcije";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { FirmaJsonLd } from "@/components/FirmaJsonLd";
import type { Metadata } from "next";

/**
 * Canonical i og:url su sišli iz `layout.tsx` (odatle su ih nasleđivale sve
 * strane koje ih same ne postavljaju, pa su „/o-nama" i „/kontakt" Google-u
 * tvrdile da su duplikat početne).
 *
 * `openGraph` se ovde navodi CEO, a ne samo `url`: Next ne spaja `openGraph` sa
 * roditeljskim po poljima nego ga zamenjuje, pa bi početna sa samo `url`
 * ostala bez `og:image`, `og:type` i `og:site_name` (provereno u build izlazu).
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: "https://plugeks.com",
    siteName: "PlugekS",
    title: "PlugekS — Uvoz i prodaja poljoprivrednih delova i mašina",
    description:
      "Rezervni delovi za plugove i roto drljače, poljoprivredne, šumske i građevinske mašine i auto-prikolice — uz finansiranje, podršku oko subvencija i isporuku širom Srbije i regiona.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "PlugekS — uvoz i prodaja poljoprivrednih delova i mašina",
      },
    ],
  },
};

// Namerno jednostavna početna — samo glavne stvari, u stilu modernog agro web-shopa.
// (Sekcije Galerija / Reference / "Zašto" i dalje postoje u kodu — po želji se
// lako vraćaju, ali ovde držimo stranicu kratkom i fokusiranom na konverziju.)
export default function HomePage() {
  return (
    <>
      {/* Podaci o firmi (Store) — samo ovde, na „O nama" i na „Kontakt". */}
      <FirmaJsonLd />
      <Hero />
      <UspBar />
      <DeloviPreview />
      <ProizvodiPreview />
      <PrikolicePreview />
      <Kategorije />
      <Akcije />
      <KontaktCTA />
    </>
  );
}
