import {
  getProductsWithPhotos,
  productHref,
  kontekstMasine,
  type Product,
} from "@/lib/products";
import { TRAILER_BRAND } from "@/lib/catalog";

/**
 * Image sitemap — poseban XML sa `image:` namespace-om, jer ugrađeni Next 14
 * sitemap ne ume da upiše `<image:image>` unose. Ovo je mehanizam kojim se
 * fotografije proizvoda prijavljuju za Google Images.
 *
 * Obuhvata SVE proizvode koji imaju pravu fotografiju — crteže delova
 * (`/images/plugovi/`), Rolland fotografije (`/images/rolland/`) i studijske
 * snimke prikolica (`/images/prikolice/`). Ranije su Rolland i Vesta slike bile
 * izostavljene i dodatno blokirane `X-Robots-Tag: noindex` headerom u
 * `next.config.mjs`, jer nose žig/autorstvo proizvođača; ta zabrana je uklonjena
 * svesnom odlukom vlasnika sajta. Kad se neka slika zameni sopstvenom
 * fotografijom, ovde ne treba menjati ništa — čita se `images.json`.
 *
 * `image:caption` je bitan: Google Images ga koristi kao opis rezultata, a fajl
 * se zove po kataloškom broju (`3374.jpg`), pa iz imena ne može da zaključi ništa.
 */

const BASE = "https://plugeks.com";

/** Google prihvata najviše 1000 slika po jednom `<url>` unosu. */
const MAX_PO_STRANI = 1000;

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );

/**
 * Strana ugradnje u ženskom rodu, uz imenicu „strana". Oznaka u podacima je
 * muška („Levi", jer ide uz „raonik"), pa bi prosto malo slovo dalo „levi
 * strana". Vrednosti su tacno dve, pa se ne pogađa nego ispisuje.
 */
const STRANA: Record<string, string> = {
  levi: "leva strana",
  desni: "desna strana",
};

/**
 * Natpis slike — ono što Google Images prikaže ispod rezultata. Sastavlja se od
 * podataka koje proizvod stvarno ima; ništa se ne izmišlja i ne ponavlja.
 */
function natpis(p: Product): string {
  const delovi: string[] = [];

  if (p.kind === "deo") {
    const kontekst = kontekstMasine(p.groupKey);
    delovi.push(
      p.brandLabel && p.brandKey !== "univerzalno"
        ? `${p.typeLabel ?? "Rezervni deo"} za ${kontekst} ${p.brandLabel}`
        : `${p.typeLabel ?? "Rezervni deo"} za ${kontekst}`,
    );
    if (STRANA[p.sideKey ?? ""]) delovi.push(STRANA[p.sideKey!]);
    delovi.push(`kataloški broj ${p.id}`);
  } else if (p.kind === "masina") {
    // Naziv se ne ponavlja — već je u `image:title`, pa bi natpis mucao
    // („Podrivač Deeper GBM — Podrivač Rolland…").
    delovi.push(`${p.typeLabel ?? "Mašina"} Rolland za obradu zemljišta`);
    if (p.tagline) delovi.push(p.tagline);
  } else {
    delovi.push(
      p.kind === "oprema"
        ? `dodatna oprema ${TRAILER_BRAND.label} za auto-prikolice`
        : `auto-prikolica ${TRAILER_BRAND.label}`,
    );
    if (p.tagline) delovi.push(p.tagline);
  }

  delovi.push("PlugekS");
  return delovi.join(", ");
}

export function GET() {
  const urls = getProductsWithPhotos()
    .filter((p): p is Product & { image: string } => Boolean(p.image))
    .slice(0, MAX_PO_STRANI * 50)
    .map((p) => {
      const loc = escapeXml(`${BASE}${productHref(p)}`);
      const img = escapeXml(`${BASE}${p.image}`);
      const title = escapeXml(p.name);
      const caption = escapeXml(natpis(p));
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        "    <image:image>",
        `      <image:loc>${img}</image:loc>`,
        `      <image:title>${title}</image:title>`,
        `      <image:caption>${caption}</image:caption>`,
        "    </image:image>",
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
