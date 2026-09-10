import type { MetadataRoute } from "next";

const BASE = "https://plugeks.com";

export default function robots(): MetadataRoute.Robots {
  return {
    // `/admin` i njegov API nose nabavne cene — ne idu u indeks. To NIJE
    // zaštita (robots.txt je javan fajl), nego higijena; prava brana je
    // lozinka u `lib/admin.ts`.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    // Dva sitemap-a: URL-ovi svih stranica + poseban image sitemap za fotografije.
    sitemap: [`${BASE}/sitemap.xml`, `${BASE}/image-sitemap.xml`],
  };
}
