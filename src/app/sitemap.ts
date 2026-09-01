import type { MetadataRoute } from "next";
import {
  getAllProducts,
  productHref,
  partTypes,
  partBrands,
  machineCategories,
  katalogBrojStrana,
} from "@/lib/products";

const BASE = "https://plugeks.com";

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

  // Kategorijske stranice — one nose pretrage tipa „lemeš za plug".
  const kategorije: MetadataRoute.Sitemap = [
    ...machineCategories().map((c) => ({
      url: `${BASE}/masine/${c.key}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...partTypes().map((t) => ({
      url: `${BASE}/delovi/${t.key}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...partBrands().map((b) => ({
      url: `${BASE}/delovi/brend/${b.key}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  // Kataloški indeks — jedini put kojim svaki proizvod dobija interni link.
  const katalog: MetadataRoute.Sitemap = Array.from(
    { length: katalogBrojStrana() },
    (_, i) => ({
      url: `${BASE}/katalog/${i + 1}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }),
  );

  const products: MetadataRoute.Sitemap = getAllProducts().map((p) => ({
    url: `${BASE}${productHref(p)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p.kind === "masina" ? 0.8 : 0.5,
  }));

  return [...staticRoutes, ...kategorije, ...katalog, ...products];
}
