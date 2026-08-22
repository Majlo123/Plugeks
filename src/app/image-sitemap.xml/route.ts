import { getProductsWithPhotos, productHref } from "@/lib/products";

/**
 * Image sitemap — poseban XML sa `image:` namespace-om, jer ugrađeni Next 14
 * sitemap ne ume da upiše `<image:image>` unose. Ovo je mehanizam kojim se
 * fotografije proizvoda prijavljuju za Google Images.
 *
 * Lista samo proizvode koji IMAJU pravu fotografiju u `public/images/rolland/`.
 * Dok tamo stoje samo skinute (watermark) slike — one će biti i ovde; zameni ih
 * čistim, licenciranim fotografijama pre puštanja u Google Search Console.
 */

const BASE = "https://plugeks.rs";

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );

export function GET() {
  const products = getProductsWithPhotos();

  const urls = products
    .map((p) => {
      const loc = escapeXml(`${BASE}${productHref(p)}`);
      const img = escapeXml(`${BASE}${p.image}`);
      const title = escapeXml(p.name);
      return `  <url>\n    <loc>${loc}</loc>\n    <image:image>\n      <image:loc>${img}</image:loc>\n      <image:title>${title}</image:title>\n    </image:image>\n  </url>`;
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
