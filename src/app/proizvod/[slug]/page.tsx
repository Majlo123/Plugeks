import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Check,
  Cog,
  Wrench,
  Phone,
  ShieldCheck,
  Truck,
  Landmark,
} from "lucide-react";
import { ProductThumb } from "@/components/ProductThumb";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  getAllProducts,
  getProductBySlug,
  productHref,
  productSlug,
  relatedProducts,
  machineDescription,
  machineHighlights,
  partDescription,
  type Product,
} from "@/lib/products";

const SITE_URL = "https://plugeks.com";

/* Sve stranice su statičke; nepoznat slug → 404 (nema tankih dinamičkih URL-ova). */
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

/* ------------------------------- Pomoćno ---------------------------------- */

const abs = (path: string) => `${SITE_URL}${path}`;

const quoteHref = (p: Product) =>
  `/zatrazi-ponudu?proizvod=${encodeURIComponent(p.name)}`;

const catalogHref = (p: Product) =>
  p.kind === "masina"
    ? `/proizvodi?vrsta=masine${p.typeKey ? `&tip=${p.typeKey}` : ""}`
    : `/proizvodi?vrsta=delovi${p.brandKey ? `&brend=${p.brandKey}` : ""}`;

/* ------------------------------- Metadata --------------------------------- */

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const p = getProductBySlug(params.slug);
  if (!p) return {};

  const canonical = `/proizvod/${p.slug}`;
  const title =
    p.kind === "masina"
      ? `${p.name} — Rolland`
      : `${p.name} — rezervni deo`;
  const description =
    p.kind === "masina"
      ? `${machineDescription(p).slice(0, 155)}`
      : `${p.name}. ${p.brandLabel && p.brandKey !== "univerzalno" ? `Za mašine ${p.brandLabel}. ` : ""}Zatražite ponudu — cena i rok isporuke isti dan. PlugekS, isporuka širom Srbije.`;

  const ogImage = p.image ? abs(p.image) : abs("/og.jpg");

  return {
    title,
    description,
    alternates: { canonical },
    keywords: [p.name, p.brandLabel ?? "", p.typeLabel ?? "", p.groupLabel, "PlugekS"].filter(
      Boolean,
    ) as string[],
    openGraph: {
      type: "website",
      url: abs(canonical),
      title: `${p.name} | PlugekS`,
      description,
      images: [{ url: ogImage, alt: p.name }],
    },
  };
}

/* ------------------------------- JSON-LD ---------------------------------- */

function ProductJsonLd({ p }: { p: Product }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.kind === "masina" ? machineDescription(p) : partDescription(p),
    category: p.groupLabel,
    // Slika u structured data samo kad postoji PRAVA fotografija proizvoda.
    ...(p.image ? { image: [abs(p.image)] } : {}),
    url: abs(`/proizvod/${p.slug}`),
    sku: p.id,
    ...(p.brandLabel && p.brandKey !== "univerzalno"
      ? { brand: { "@type": "Brand", name: p.brandLabel } }
      : {}),
    // Cena se dogovara upitom (nema fiksnog cenovnika), pa se `offers.price`
    // namerno izostavlja — navodimo samo prodavca i način nabavke.
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "RSD",
      url: abs(quoteHref(p)),
      seller: { "@type": "Organization", name: site.name },
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Proizvodi", item: abs("/proizvodi") },
      {
        "@type": "ListItem",
        position: 3,
        name: p.groupLabel,
        item: abs(catalogHref(p)),
      },
      { "@type": "ListItem", position: 4, name: p.name, item: abs(`/proizvod/${p.slug}`) },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}

/* -------------------------------- Stranica -------------------------------- */

export default function ProductPage({ params }: { params: { slug: string } }) {
  const p = getProductBySlug(params.slug);
  if (!p) notFound();

  return (
    <>
      <ProductJsonLd p={p} />

      <article className="bg-cream pb-16 pt-28 md:pt-32">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-brand">Početna</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/proizvodi" className="hover:text-brand">Proizvodi</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={catalogHref(p)} className="hover:text-brand">{p.groupLabel}</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-charcoal">{p.name}</span>
          </nav>

          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Vizual */}
            <div>
              <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
                <ProductThumb
                  src={p.image}
                  name={p.name}
                  kind={p.kind}
                  typeKey={p.typeKey}
                  groupKey={p.groupKey}
                  code={p.id}
                  metaLabel={
                    p.brandLabel && p.brandKey !== "univerzalno" ? p.brandLabel : p.typeLabel
                  }
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className={cn(
                    "w-full",
                    p.kind === "masina" ? "aspect-[16/10]" : "aspect-[4/3]",
                  )}
                />
              </div>
            </div>

            {/* Podaci */}
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  {p.kind === "masina" ? <Cog className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
                  {p.groupLabel}
                </span>
                {p.brandLabel && p.brandKey !== "univerzalno" ? (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80">
                    {p.brandLabel}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-charcoal md:text-4xl">
                {p.name}
              </h1>
              {p.tagline ? (
                <p className="mt-3 text-lg text-muted-foreground">{p.tagline}</p>
              ) : null}

              <p className="mt-4 leading-relaxed text-foreground/85">
                {p.kind === "masina" ? machineDescription(p) : partDescription(p)}
              </p>

              {p.kind === "masina" ? (
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {machineHighlights(p).map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-foreground/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      {h}
                    </li>
                  ))}
                </ul>
              ) : (
                <SpecTable p={p} />
              )}

              {/* CTA */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="primary" size="lg" className="sm:flex-1">
                  <Link href={quoteHref(p)}>
                    Zatraži ponudu
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="sm:flex-1">
                  <a href={site.telHref}>
                    <Phone className="h-4 w-4" />
                    {site.phoneDisplay}
                  </a>
                </Button>
              </div>

              {/* Poverenje */}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand" /> Garancija i delovi</span>
                <span className="inline-flex items-center gap-1.5"><Landmark className="h-4 w-4 text-brand" /> Subvencije i rate</span>
                <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-brand" /> Isporuka širom Srbije</span>
              </div>
            </div>
          </div>

          {/* Srodni proizvodi */}
          <RelatedGrid p={p} />
        </div>
      </article>
    </>
  );
}

/* ------------------------------ Podkomponente ----------------------------- */

function SpecTable({ p }: { p: Product }) {
  const rows: [string, string][] = [
    ["Kataloški broj", p.id],
    ["Tip dela", p.typeLabel ?? "—"],
    ["Brend mašine", p.brandKey && p.brandKey !== "univerzalno" ? p.brandLabel! : "Univerzalno / bez oznake"],
    ...(p.sideLabel ? ([["Strana ugradnje", p.sideLabel]] as [string, string][]) : []),
    ["Kategorija", p.groupLabel],
  ];
  return (
    <dl className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`flex justify-between gap-4 px-4 py-3 text-sm ${i % 2 ? "bg-cream/40" : ""}`}
        >
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right font-medium text-charcoal">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function RelatedGrid({ p }: { p: Product }) {
  const related = relatedProducts(p, 4);
  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-bold text-charcoal">
        {p.kind === "masina" ? "Slične mašine" : "Slični delovi"}
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((r) => (
          <Link
            key={r.id}
            href={productHref(r)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <ProductThumb
              src={r.image}
              name={r.name}
              kind={r.kind}
              typeKey={r.typeKey}
              groupKey={r.groupKey}
              code={r.id}
              sizes="(max-width: 640px) 50vw, 25vw"
              className={cn(
                "w-full",
                r.kind === "masina" ? "aspect-[16/10]" : "aspect-[4/3]",
              )}
            />
            <div className="flex flex-1 flex-col p-3">
              <h3 className="line-clamp-2 text-sm font-semibold text-charcoal group-hover:text-brand">
                {r.name}
              </h3>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand">
                Detaljnije <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
