import { Hero } from "@/components/sections/Hero";
import { UspBar } from "@/components/sections/UspBar";
import { Kategorije } from "@/components/sections/Kategorije";
import { ProizvodiPreview } from "@/components/sections/ProizvodiPreview";
import { DeloviPreview } from "@/components/sections/DeloviPreview";
import { Akcije } from "@/components/sections/Akcije";
import { KontaktCTA } from "@/components/sections/KontaktCTA";

// Namerno jednostavna početna — samo glavne stvari, u stilu modernog agro web-shopa.
// (Sekcije Galerija / Reference / "Zašto" i dalje postoje u kodu — po želji se
// lako vraćaju, ali ovde držimo stranicu kratkom i fokusiranom na konverziju.)
export default function HomePage() {
  return (
    <>
      <Hero />
      <UspBar />
      <Kategorije />
      <ProizvodiPreview />
      <DeloviPreview />
      <Akcije />
      <KontaktCTA />
    </>
  );
}
