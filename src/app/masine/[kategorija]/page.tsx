import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductThumb } from "@/components/ProductThumb";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import {
  machineCategories,
  getMachinesByCategory,
  machineBranchOfType,
  machineTypesForBranch,
  productHref,
  uzBroj,
} from "@/lib/products";
import { GRANE, granaHref } from "@/lib/masine";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { SpisakJsonLd } from "@/components/SpisakJsonLd";

/**
 * Stranica jednog tipa mašina (tanjirače, malčeri, cepači drva, mini bageri…).
 *
 * Za razliku od kategorijskih strana delova — gde je cilj samo da svaki od
 * 4.644 komada ima dohvatljiv link, pa je spisak go — ovde su mašine u mreži sa
 * fotografijama. Mašina se bira po izgledu, a i ima ih taman toliko da svaka
 * stane u kadar.
 */

const nadji = (kljuc: string) => machineCategories().find((c) => c.key === kljuc);

export function generateStaticParams() {
  return machineCategories().map((c) => ({ kategorija: c.key }));
}

export function generateMetadata({ params }: { params: { kategorija: string } }): Metadata {
  const kat = nadji(params.kategorija);
  if (!kat) return {};

  const grana = machineBranchOfType(kat.key);
  const opis = grana
    ? `${kat.label} iz naše ponude — ${GRANE[grana].opis.toLowerCase()} Finansiranje, podrška oko subvencija i isporuka širom Srbije.`
    : `${kat.label} iz naše ponude. Finansiranje, podrška oko subvencija i isporuka širom Srbije.`;

  return {
    title: `${kat.label} — ${kat.count} ${uzBroj(kat.count, "mašina", "mašine", "mašina")} u ponudi`,
    description: opis,
    alternates: { canonical: `/masine/${kat.key}` },
    keywords: [kat.label, grana ? GRANE[grana].label : "", "PlugekS"].filter(Boolean),
  };
}

export default function KategorijaMasinaPage({ params }: { params: { kategorija: string } }) {
  const kat = nadji(params.kategorija);
  if (!kat) notFound();

  const masine = getMachinesByCategory(kat.key);
  const grana = machineBranchOfType(kat.key);
  // Susedni tipovi iz iste grane — kupac koji je promašio tip ne mora nazad na
  // spisak svih mašina.
  const susedni = grana
    ? machineTypesForBranch(grana).filter((t) => t.key !== kat.key)
    : [];

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Mašine", href: "/masine" },
          ...(grana ? [{ naziv: GRANE[grana].label, href: granaHref(grana) }] : []),
          { naziv: kat.label, href: `/masine/${kat.key}` },
        ]}
      />
      <SpisakJsonLd naziv={kat.label} stavke={masine} />

      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <Link
            href={grana ? granaHref(grana) : "/masine"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            {grana ? GRANE[grana].label : "Sve mašine"}
          </Link>

          <h1 className="mt-4 font-display text-2xl font-bold text-charcoal md:text-3xl">
            {kat.label}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {kat.count} {uzBroj(kat.count, "model", "modela", "modela")} u ponudi.
            Recite nam kakav je posao i kojim traktorom raspolažete — preporučujemo
            odgovarajuću izvedbu i šaljemo cenu isti dan.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {masine.map((m) => (
              <Link
                key={m.id}
                href={productHref(m)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bone shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
              >
                <ProductThumb
                  src={m.image}
                  name={m.name}
                  kind="masina"
                  typeKey={m.typeKey}
                  groupKey={m.groupKey}
                  code={m.id}
                  metaLabel={m.brandLabel}
                  podloga="bg-bone"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="font-display text-[0.95rem] font-bold leading-tight text-charcoal group-hover:text-brand">
                    {m.name}
                  </h2>
                  {m.tagline ? (
                    <p className="mt-1.5 text-[0.85rem] leading-snug text-muted-foreground">
                      {m.tagline}
                    </p>
                  ) : null}
                  <div className="flex-1" />
                  <span className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-medium text-brand">
                    Detaljnije
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {susedni.length > 0 ? (
            <nav className="mt-12 border-t border-border pt-6">
              <p className="text-sm font-semibold text-charcoal">
                Ostalo iz grupe „{grana ? GRANE[grana].label : "Mašine"}”
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {susedni.map((t) => (
                  <li key={t.key}>
                    <Link href={`/masine/${t.key}`} className="text-brand hover:underline">
                      {t.label}
                    </Link>{" "}
                    <span className="text-muted-foreground">({t.count})</span>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </section>

      <KontaktCTA />
    </>
  );
}
