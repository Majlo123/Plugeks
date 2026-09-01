import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ListaProizvoda } from "@/components/ListaProizvoda";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { partBrands, getPartsByBrand, partTypes } from "@/lib/products";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";

/**
 * Delovi po marki pluga. „Lemken delovi" i slično su pretrage visoke namere —
 * ko ih kuca, traži tačno ono što prodajemo. Statički segment `brend` ima
 * prednost nad `/delovi/[tip]`, pa nema sudara ruta.
 */

const MAX_NA_STRANI = 300;

const nadji = (kljuc: string) => partBrands().find((b) => b.key === kljuc);

export function generateStaticParams() {
  return partBrands().map((b) => ({ brend: b.key }));
}

export function generateMetadata({ params }: { params: { brend: string } }): Metadata {
  const brend = nadji(params.brend);
  if (!brend) return {};

  return {
    title: `${brend.label} — rezervni delovi za plugove`,
    description: `Rezervni delovi za plugove ${brend.label} — lemeši, plužne daske, plazovi, grudi i lajsne. ${brend.count} kataloških brojeva. Pošaljite oznaku pluga, javljamo cenu i rok isti dan.`,
    alternates: { canonical: `/delovi/brend/${brend.key}` },
    keywords: [
      `${brend.label} delovi`,
      `delovi za plug ${brend.label}`,
      `${brend.label} lemeš`,
      "rezervni delovi za plugove",
    ],
  };
}

export default function BrendPage({ params }: { params: { brend: string } }) {
  const brend = nadji(params.brend);
  if (!brend) notFound();

  const svi = getPartsByBrand(brend.key);
  const prikazani = svi.slice(0, MAX_NA_STRANI);
  const ostali = svi.length - prikazani.length;

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Proizvodi", href: "/proizvodi" },
          { naziv: brend.label, href: `/delovi/brend/${brend.key}` },
        ]}
      />
      <PageHeader
        breadcrumb={brend.label}
        title={`Delovi za plugove ${brend.label}`}
        description={`${brend.count} kataloških brojeva za plugove ${brend.label}. Ako niste sigurni koji deo vam treba, pošaljite oznaku pluga ili fotografiju — pronaći ćemo odgovarajući.`}
        tone="steel"
      />

      <section className="section bg-cream">
        <div className="container">
          <ListaProizvoda items={prikazani} />

          {ostali > 0 && (
            <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
              Prikazano prvih {prikazani.length} od {svi.length}. Ostatak je u{" "}
              <Link href="/katalog/1" className="font-medium text-brand hover:underline">
                kompletnom katalogu
              </Link>
              .
            </p>
          )}

          <nav className="mt-12 border-t border-border pt-6">
            <p className="text-sm font-semibold text-charcoal">Delovi po tipu</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {partTypes().map((t) => (
                <li key={t.key}>
                  <Link href={`/delovi/${t.key}`} className="text-brand hover:underline">
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm font-semibold text-charcoal">Ostale marke</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {partBrands()
                .filter((b) => b.key !== brend.key)
                .map((b) => (
                  <li key={b.key}>
                    <Link href={`/delovi/brend/${b.key}`} className="text-brand hover:underline">
                      {b.label} <span className="text-muted-foreground">({b.count})</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
