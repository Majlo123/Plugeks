import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { machineBranches } from "@/lib/products";
import { granaHref, type GranaKljuc } from "@/lib/masine";
import { categories } from "@/lib/data";

/**
 * Ulaz u ponudu mašina — bira se GRANA, pa tek onda tip mašine.
 *
 * ZAŠTO SAMO TRI KARTICE: ranije su ovde stajali svi tipovi iz sve tri grane
 * odjednom. Poljoprivrednih je trinaest, pa su zauzimale četiri reda i pola
 * strane — šumske i građevinske su bile toliko nisko da se do njih dolazilo
 * skrolovanjem i, praktično, nisu ni postojale. Kupac koji traži cepač drva ne
 * treba da prođe kroz trinaest poljoprivrednih pločica da bi video da ga imamo.
 *
 * Zato prvi korak bira posao (njiva / šuma / gradilište), a tipovi dolaze
 * unutar grane (`/masine/grana/[grana]`). Isti obrazac koji ima i izvor.
 */

export const metadata: Metadata = {
  title: "Mašine — poljoprivredne, šumske i građevinske",
  description:
    "Poljoprivredne, šumske i građevinske mašine: tanjirače, plugovi, malčeri, kosačice i balirke, sejalice i prskalice, cepači drva, iverači, kružne pile, mini bageri i utovarivači. Izaberite za kakav posao vam mašina treba.",
  alternates: { canonical: "/masine" },
  keywords: [
    "poljoprivredne mašine",
    "šumske mašine",
    "građevinske mašine",
    "priključne mašine",
    "cepač drva",
    "mini bager",
    "PlugekS",
  ],
};

/** Fotografija i boja grane žive u `categories` — isti vizual kao na početnoj. */
const vizual = (kljuc: string) => categories.find((c) => c.key === kljuc);

export default function MasinePage() {
  const grane = machineBranches();

  return (
    <>
      <PutanjaJsonLd stavke={[{ naziv: "Mašine", href: "/masine" }]} />

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
            Mašine
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Izaberite za kakav posao vam mašina treba — unutra birate tip i model.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {grane.map((grana) => {
              const v = vizual(grana.key);
              const Icon = v?.icon;

              return (
                <Link
                  key={grana.key}
                  href={granaHref(grana.key as GranaKljuc)}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bone shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <MediaPlaceholder
                      tone={v?.tone}
                      icon={Icon}
                      src={v?.image}
                      alt={grana.label}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                    />
                    {Icon ? (
                      <div className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-cream/90 text-brand shadow-soft backdrop-blur">
                        <Icon className="h-5 w-5" />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-[1.3rem] font-bold tracking-[-0.012em] text-charcoal">
                        {grana.label}
                      </h2>
                      <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-foreground/70 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                    </div>

                    <p className="mt-2 text-[0.96rem] leading-relaxed text-muted-foreground">
                      {grana.opis}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            Ne znate koja vam mašina treba?{" "}
            <Link
              href="/zatrazi-ponudu"
              className="font-medium text-brand hover:underline"
            >
              Recite nam kakav je posao i kojim traktorom raspolažete
            </Link>{" "}
            — predlažemo model i šaljemo cenu isti dan.
          </p>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
