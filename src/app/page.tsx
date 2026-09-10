import { Hero } from "@/components/sections/Hero";
import { getMachines, getParts, getTrailers } from "@/lib/products";
import { UspBar } from "@/components/sections/UspBar";
import { Kategorije } from "@/components/sections/Kategorije";
import { ProizvodiPreview } from "@/components/sections/ProizvodiPreview";
import { DeloviPreview } from "@/components/sections/DeloviPreview";
import { PrikolicePreview } from "@/components/sections/PrikolicePreview";
import { Akcije } from "@/components/sections/Akcije";
import { KontaktCTA } from "@/components/sections/KontaktCTA";

// Namerno jednostavna početna — samo glavne stvari, u stilu modernog agro web-shopa.
// (Sekcije Galerija / Reference / "Zašto" i dalje postoje u kodu — po želji se
// lako vraćaju, ali ovde držimo stranicu kratkom i fokusiranom na konverziju.)
export default function HomePage() {
  // Brojke za ulaze u hero-u — čitaju se ovde, na serveru, da klijentska
  // komponenta ne bi morala da uvuče `parts.json` (~300 KB) u bundle.
  const brojke = {
    masina: getMachines().length,
    delova: getParts().length,
    prikolica: getTrailers().length,
  };

  return (
    <>
      <Hero brojke={brojke} />
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
