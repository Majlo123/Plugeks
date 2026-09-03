import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ListaProizvoda } from "@/components/ListaProizvoda";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { partTypes, getPartsByType } from "@/lib/products";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";

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
    title: `${tip.label} za plugove — ${tip.count} delova`,
    description: `${tip.label} za plugove svih vodećih proizvođača — Lemken, Kuhn, Kverneland, Rabe, Vogel & Noot, Pöttinger i drugi. ${tip.count} kataloških brojeva na stanju ili po porudžbini. Zatražite ponudu, javljamo se isti dan.`,
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
          { naziv: tip.label, href: `/delovi/${tip.key}` },
        ]}
      />
      <PageHeader
        breadcrumb={tip.label}
        title={`${tip.label} za plugove`}
        description={`${tip.count} kataloških brojeva za plugove svih vodećih proizvođača. Recite nam marku i model pluga — pronaći ćemo odgovarajući deo i poslati cenu isti dan.`}
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
              </Link>{" "}
              ili nam javite kataloški broj pa proveravamo direktno.
            </p>
          )}

          <nav className="mt-12 border-t border-border pt-6">
            <p className="text-sm font-semibold text-charcoal">Ostali tipovi delova</p>
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
