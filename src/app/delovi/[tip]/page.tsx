import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListaProizvoda } from "@/components/ListaProizvoda";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { partTypes, getPartsByType, partBrands, katBrojeva, uzBroj } from "@/lib/products";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { SpisakJsonLd } from "@/components/SpisakJsonLd";

/**
 * Stranica po tipu dela (raonik, daska, plaz…). Ovo su pojmovi koje
 * ljudi zaista kucaju, a do sada su postojali samo kao filter u URL-u
 * (`/proizvodi?vrsta=delovi&tip=lemes`), što Google ne indeksira kao zasebnu
 * stranicu.
 */

/** Duže liste seče `/katalog`, koji ionako pokriva baš sve. */
const MAX_NA_STRANI = 300;

const nadjiTip = (kljuc: string) => partTypes().find((t) => t.key === kljuc);

export function generateStaticParams() {
  return partTypes().map((t) => ({ tip: t.key }));
}

export function generateMetadata({ params }: { params: { tip: string } }): Metadata {
  const tip = nadjiTip(params.tip);
  if (!tip) return {};

  return {
    title: `${tip.label} za plugove — ${tip.count} ${uzBroj(tip.count, "deo", "dela", "delova")}`,
    description: `${tip.label} za plugove svih vodećih proizvođača — Lemken, Kuhn, Kverneland, Rabe, Vogel & Noot, Pöttinger i drugi. ${katBrojeva(tip.count)} na stanju ili po porudžbini. Zatražite ponudu, javljamo se isti dan.`,
    alternates: { canonical: `/delovi/${tip.key}` },
    keywords: [tip.label, `${tip.label} za plug`, "rezervni delovi za plugove", "PlugekS"],
  };
}

export default function TipDelaPage({ params }: { params: { tip: string } }) {
  const tip = nadjiTip(params.tip);
  if (!tip) notFound();

  const svi = getPartsByType(tip.key);
  const prikazani = svi.slice(0, MAX_NA_STRANI);
  const ostali = svi.length - prikazani.length;

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Proizvodi", href: "/proizvodi" },
          { naziv: `${tip.label} za plugove`, href: `/delovi/${tip.key}` },
        ]}
      />
      <SpisakJsonLd
        naziv={`${tip.label} za plugove`}
        stavke={prikazani}
        ukupno={svi.length}
      />
      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <h1 className="font-display text-2xl font-bold text-charcoal md:text-3xl">
            {tip.label} za plugove
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {katBrojeva(tip.count)} za plugove svih vodećih proizvođača. Recite nam
            marku i model pluga — pronaći ćemo odgovarajući deo i poslati cenu isti dan.
          </p>

          <div className="mt-8">
            <ListaProizvoda items={prikazani} />
          </div>

          {ostali > 0 && (
            <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
              Prikazano prvih {prikazani.length} od {svi.length}. Ostatak je u{" "}
              <Link href="/katalog/1" className="font-medium text-brand hover:underline">
                kompletnom katalogu
              </Link>{" "}
              ili nam javite kataloški broj pa proveravamo direktno.
            </p>
          )}

          <nav className="mt-12 border-t border-border pt-6">
            {/* Marke su ovde zato što se „raonik" i „raonik za Lemken" traže kao
                dva različita upita — svaka strana mora da vodi na onu drugu. */}
            <p className="text-sm font-semibold text-charcoal">
              {tip.label} po marki pluga
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {partBrands().map((b) => (
                <li key={b.key}>
                  <Link href={`/delovi/brend/${b.key}`} className="text-brand hover:underline">
                    {tip.label} {b.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm font-semibold text-charcoal">Ostali tipovi delova</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {partTypes()
                .filter((t) => t.key !== tip.key)
                .map((t) => (
                  <li key={t.key}>
                    <Link href={`/delovi/${t.key}`} className="text-brand hover:underline">
                      {t.label}{" "}
                      <span className="text-muted-foreground">({t.count})</span>
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
