import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProizvodiClient } from "./ProizvodiClient";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { partTypes, partBrands, machineCategories, katalogBrojStrana } from "@/lib/products";

export const metadata: Metadata = {
  title: "Proizvodi — Mašine i rezervni delovi",
  description:
    "Katalog poljoprivredne mehanizacije i preko 4.600 rezervnih delova za plugove, agregate, tanjirače, sejalice i vadilice — Lemken, Kuhn, Kverneland, Rabe, Pöttinger i drugi. Filtrirajte po brendu i tipu dela i zatražite ponudu.",
};

export default function ProizvodiPage() {
  return (
    <>
      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Učitavanje…</div>}>
            <ProizvodiClient />
          </Suspense>
        </div>
      </section>

      {/*
        Serverski deo stranice. Katalog iznad je klijentski i u polaznom HTML-u
        nema nijedan link ka proizvodu, pa bi bez ovoga kategorijske stranice i
        kataloški indeks ostali nedohvatljivi za Googlebot.
      */}
      <section className="section border-t border-border bg-white">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Pregled po kategorijama
          </h2>

          <p className="mt-6 text-sm font-semibold text-charcoal">Mašine</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {machineCategories().map((c) => (
              <li key={c.key}>
                <Link href={`/masine/${c.key}`} className="text-brand hover:underline">
                  {c.label} <span className="text-muted-foreground">({c.count})</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm font-semibold text-charcoal">Delovi po tipu</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {partTypes().map((t) => (
              <li key={t.key}>
                <Link href={`/delovi/${t.key}`} className="text-brand hover:underline">
                  {t.label} <span className="text-muted-foreground">({t.count})</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm font-semibold text-charcoal">Delovi po marki pluga</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {partBrands().map((b) => (
              <li key={b.key}>
                <Link href={`/delovi/brend/${b.key}`} className="text-brand hover:underline">
                  {b.label} <span className="text-muted-foreground">({b.count})</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm text-muted-foreground">
            Ili prelistajte{" "}
            <Link href="/katalog/1" className="font-medium text-brand hover:underline">
              kompletan katalog
            </Link>{" "}
            — sve na {katalogBrojStrana()} strana.
          </p>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
