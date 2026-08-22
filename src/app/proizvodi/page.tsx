import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ProizvodiClient } from "./ProizvodiClient";
import { KontaktCTA } from "@/components/sections/KontaktCTA";

export const metadata: Metadata = {
  title: "Proizvodi — Mašine i rezervni delovi",
  description:
    "Katalog poljoprivredne mehanizacije i preko 4.600 rezervnih delova za plugove, agregate, tanjirače, sejalice i vadilice — Lemken, Kuhn, Kverneland, Rabe, Pöttinger i drugi. Filtrirajte po brendu i tipu dela i zatražite ponudu.",
};

export default function ProizvodiPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Proizvodi"
        title="Katalog mehanizacije i delova"
        description="Recite nam da li tražite mašinu ili rezervni deo, suzite izbor filterima i u par klikova zatražite ponudu. Javljamo se sa cenom isti dan."
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
