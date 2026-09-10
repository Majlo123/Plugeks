import {
  getProductsWithPhotos,
  productHref,
  natpisSlike,
  type Product,
} from "@/lib/products";

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

export function GET() {
  const urls = getProductsWithPhotos()
    .filter((p): p is Product & { image: string } => Boolean(p.image))
    .slice(0, MAX_PO_STRANI * 50)
    .map((p) => {
      const loc = escapeXml(`${BASE}${productHref(p)}`);
      const img = escapeXml(`${BASE}${p.image}`);
      const title = escapeXml(p.name);
      const caption = escapeXml(natpisSlike(p));
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
