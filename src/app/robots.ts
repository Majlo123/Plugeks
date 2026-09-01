import type { MetadataRoute } from "next";

const BASE = "https://plugeks.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Dva sitemap-a: URL-ovi svih stranica + poseban image sitemap za fotografije.
    sitemap: [`${BASE}/sitemap.xml`, `${BASE}/image-sitemap.xml`],
  };
}
