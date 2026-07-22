import type { MetadataRoute } from "next";

const BASE = "https://plugeks.rs";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/proizvodi", "/subvencije-i-finansiranje", "/o-nama", "/kontakt"];
  const now = new Date();
  return routes.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
