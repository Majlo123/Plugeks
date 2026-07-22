import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ProizvodiClient } from "./ProizvodiClient";
import { KontaktCTA } from "@/components/sections/KontaktCTA";

export const metadata: Metadata = {
  title: "Proizvodi — Malčeri, freze, utovarivači, traktori",
  description:
    "Kompletan katalog poljoprivredne mehanizacije: malčeri, freze, prednji utovarivači, kompakt traktori, priključne mašine i rezervni delovi. Zatražite ponudu.",
};

export default function ProizvodiPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Proizvodi"
        title="Katalog mehanizacije"
        description="Izaberite kategoriju, pogledajte specifikacije i za svaki model u par klikova zatražite ponudu. Javljamo se sa cenom isti dan."
        tone="steel"
        image="/images/utovarivaci.jpg"
      />

      <section className="section bg-cream pt-12 md:pt-16">
        <div className="container">
          <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Učitavanje…</div>}>
            <ProizvodiClient />
          </Suspense>
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
