import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrikoliceFilter } from "@/components/PrikoliceFilter";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import {
  trailerCategories,
  trailerAccessoryGroups,
  getTrailersByType,
  uzBroj,
} from "@/lib/products";
import { TRAILER_PROGRAMS } from "@/lib/catalog";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { SpisakJsonLd } from "@/components/SpisakJsonLd";

/**
 * Stranica po programu prikolica (LIGHT, PLATO, MARINE…) i po grupi dodatne
 * opreme (Cerade, Čekrci…) — drugi korak posle pločica na `/prikolice`.
 *
 * Ovde su i kartice sa slikom i filteri, ali samo oni koji u ovom programu
 * zaista nose izbor (osovine, najveća masa) — vidi `PrikoliceFilter`.
 */

const svePrikolice = () => trailerCategories();
const svaOprema = () => trailerAccessoryGroups();
const sve = () => [...svePrikolice(), ...svaOprema()];

const nadji = (kljuc: string) => sve().find((c) => c.key === kljuc);
const jeOprema = (kljuc: string) => kljuc.startsWith("oprema-");

/** Uvodni pasus: za prikolice se sastavlja iz namene programa, za opremu je opšti. */
function opis(kljuc: string, naziv: string, broj: number): string {
  const program = TRAILER_PROGRAMS[kljuc];
  if (program) {
    return `${naziv} — ${program.namena}. ${broj} ${uzBroj(
      broj,
      "model",
      "modela",
      "modela",
    )} u ponudi, sa pocinkovanom konstrukcijom i garancijom. Zatražite ponudu — javljamo se isti dan, isporuka širom Srbije i regiona.`;
  }
  return `${naziv} za prikolice — ${broj} ${uzBroj(
    broj,
    "komad",
    "komada",
    "komada",
  )} originalne dodatne opreme. Recite nam model prikolice i potvrđujemo kompatibilnost, cenu i rok isporuke.`;
}

export function generateStaticParams() {
  return sve().map((c) => ({ tip: c.key }));
}

export function generateMetadata({ params }: { params: { tip: string } }): Metadata {
  const kat = nadji(params.tip);
  if (!kat) return {};

  return {
    title: `${kat.label} — ${kat.count} ${
      jeOprema(kat.key)
        ? uzBroj(kat.count, "komad", "komada", "komada")
        : uzBroj(kat.count, "model", "modela", "modela")
    }`,
    description: opis(kat.key, kat.label, kat.count),
    alternates: { canonical: `/prikolice/${kat.key}` },
    keywords: [
      kat.label,
      "auto prikolica",
      "prikolica za auto",
      jeOprema(kat.key) ? "oprema za prikolice" : "nova prikolica",
      "PlugekS",
    ],
  };
}

export default function TipPrikolicePage({ params }: { params: { tip: string } }) {
  const kat = nadji(params.tip);
  if (!kat) notFound();

  const braca = jeOprema(kat.key) ? svaOprema() : svePrikolice();
  const drugaStrana = jeOprema(kat.key) ? svePrikolice() : svaOprema();

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Auto-prikolice", href: "/prikolice" },
          { naziv: kat.label, href: `/prikolice/${kat.key}` },
        ]}
      />
      <SpisakJsonLd
        naziv={kat.label}
        opis={opis(kat.key, kat.label, kat.count)}
        stavke={getTrailersByType(kat.key)}
      />
      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <Link
            href="/prikolice"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Sve prikolice
          </Link>

          <h1 className="mt-4 font-display text-2xl font-bold text-charcoal md:text-3xl">
            {kat.label}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {opis(kat.key, kat.label, kat.count)}
          </p>

          <div className="mt-8">
            <PrikoliceFilter program={kat.key} />
          </div>

          <nav className="mt-12 border-t border-border pt-6">
            <p className="text-sm font-semibold text-charcoal">
              {jeOprema(kat.key) ? "Ostala oprema" : "Ostali programi"}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {braca
                .filter((c) => c.key !== kat.key)
                .map((c) => (
                  <li key={c.key}>
                    <Link href={`/prikolice/${c.key}`} className="text-brand hover:underline">
                      {c.label} <span className="text-muted-foreground">({c.count})</span>
                    </Link>
                  </li>
                ))}
            </ul>

            <p className="mt-6 text-sm font-semibold text-charcoal">
              {jeOprema(kat.key) ? "Programi prikolica" : "Dodatna oprema"}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {drugaStrana.map((c) => (
                <li key={c.key}>
                  <Link href={`/prikolice/${c.key}`} className="text-brand hover:underline">
                    {c.label} <span className="text-muted-foreground">({c.count})</span>
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
