import { Suspense } from "react";
import type { Metadata } from "next";
import { ProizvodiClient } from "./ProizvodiClient";
import { KontaktCTA } from "@/components/sections/KontaktCTA";

export const metadata: Metadata = {
  title: "Proizvodi — Mašine, auto-prikolice i rezervni delovi",
  description:
    "Katalog poljoprivredne mehanizacije, 65 modela auto-prikolica od 500 do 3500 kg sa dodatnom opremom i preko 4.600 rezervnih delova za plugove, agregate, tanjirače, sejalice i vadilice. Filtrirajte i zatražite ponudu.",
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

      <KontaktCTA />
    </>
  );
}
