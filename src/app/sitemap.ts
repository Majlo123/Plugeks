import type { MetadataRoute } from "next";
import { getAllProducts, productHref } from "@/lib/products";

const BASE = "https://www.plugeks.com";

/**
 * Sitemap svih stranica (početna, kategorije + svaki proizvod).
 *
 * Fotografije NISU ovde: ugrađeni Next 14 sitemap ne ume da upiše `<image:image>`.
 * Za Google Images postoji poseban `/image-sitemap.xml` (vidi route handler),
 * a oba su prijavljena u `robots.ts`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/proizvodi`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/subvencije-i-finansiranje`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/o-nama`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/zatrazi-ponudu`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const products: MetadataRoute.Sitemap = getAllProducts().map((p) => ({
    url: `${BASE}${productHref(p)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p.kind === "masina" ? 0.8 : 0.5,
  }));

  return [...staticRoutes, ...products];
}
