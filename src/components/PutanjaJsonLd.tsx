const SITE_URL = "https://plugeks.com";

/**
 * BreadcrumbList strukturirani podaci. Google ih koristi da u rezultatu umesto
 * golog URL-a prikaže putanju (Početna › Delovi › Raonik), što primetno podiže
 * broj klikova. Stranice proizvoda ovo već imaju; ovde je za nove kategorijske.
 */
export function PutanjaJsonLd({
  stavke,
}: {
  stavke: Array<{ naziv: string; href: string }>;
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: SITE_URL },
      ...stavke.map((s, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: s.naziv,
        item: `${SITE_URL}${s.href}`,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
