import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { Plocica } from "@/components/Plocica";
import {
  trailerCategories,
  trailerAccessoryGroups,
  getTrailersByType,
  uzBroj,
} from "@/lib/products";
import { TRAILER_PROGRAMS } from "@/lib/catalog";

/**
 * Ulaz u ponudu prikolica — pločice sa fotografijom, po jedna za svaki program.
 *
 * Kupac ne zna šta je „jednoosovinska 1300 kg”, ali odmah prepozna prikolicu za
 * čamac ili za auto. Zato ovde nema nijednog filtera: bira se po slici, a
 * osovine i nosivost dolaze tek unutar programa (`/prikolice/[tip]`), gde je
 * izbor sveden na dva reda čipova.
 */

export const metadata: Metadata = {
  title: "Auto-prikolice — 65 modela od 500 do 3500 kg",
  description:
    "Auto-prikolice po nameni: za svakodnevni prevoz, platforme, za automobil, građevinske mašine, čamac ili motocikl. Izaberite vrstu po slici, pa broj osovina i nosivost. Isporuka širom Srbije.",
  alternates: { canonical: "/prikolice" },
  keywords: [
    "auto prikolice",
    "prikolica za auto",
    "prikolica za čamac",
    "prikolica za motocikl",
    "prikolica za automobil",
    "PlugekS",
  ],
};

export default function PrikolicePage() {
  const programi = trailerCategories();
  const oprema = trailerAccessoryGroups();
  const ukupno = programi.reduce((zbir, p) => zbir + p.count, 0);

  return (
    <>
      <PutanjaJsonLd stavke={[{ naziv: "Auto-prikolice", href: "/prikolice" }]} />

      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <Link
            href="/proizvodi"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Svi proizvodi
          </Link>

          <h1 className="mt-4 font-display text-2xl font-bold text-charcoal md:text-3xl">
            Auto-prikolice
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {ukupno} {uzBroj(ukupno, "model", "modela", "modela")} od 500 do 3500 kg.
            Izaberite vrstu prikolice — unutra birate broj osovina i nosivost.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {programi.map((p) => {
              const program = TRAILER_PROGRAMS[p.key];
              // Prva prikolica programa je i njegov „portret" — sve imaju
              // fotografiju, pa pločica nikad ne ostaje prazna.
              const naslovna = getTrailersByType(p.key)[0];
              return (
                <Plocica
                  key={p.key}
                  href={`/prikolice/${p.key}`}
                  naslov={program?.oznaka ?? p.label}
                  podnaslov={program?.kratko}
                  broj={`${p.count} ${uzBroj(p.count, "model", "modela", "modela")}`}
                  slika={naslovna?.image}
                  alt={naslovna?.name ?? p.label}
                />
              );
            })}
          </div>

          <div className="mt-16 border-t border-border pt-12">
            <h2 className="font-display text-xl font-bold text-charcoal md:text-2xl">
              Dodatna oprema za prikolice
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Cerade i arnjevi, dodatne stranice, čekrci, potporni točkovi i
              rezervni delovi — originalna oprema uz svaki program.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {oprema.map((g) => {
                const naslovna = getTrailersByType(g.key)[0];
                return (
                  <Plocica
                    key={g.key}
                    href={`/prikolice/${g.key}`}
                    naslov={g.label}
                    broj={`${g.count} ${uzBroj(g.count, "komad", "komada", "komada")}`}
                    slika={naslovna?.image}
                    alt={naslovna?.name ?? g.label}
                    sitno
                  />
                );
              })}
            </div>
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            Ne znate koji program vam treba?{" "}
            <Link
              href="/zatrazi-ponudu"
              className="font-medium text-brand hover:underline"
            >
              Recite nam šta prevozite
            </Link>{" "}
            — predlažemo model i šaljemo cenu isti dan.
          </p>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
