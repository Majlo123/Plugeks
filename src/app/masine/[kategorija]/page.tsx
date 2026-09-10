import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MasinaKartica } from "@/components/MasinaKartica";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import {
  machineCategories,
  getMachinesByCategory,
  machineBranchOfType,
  machineTypesForBranch,
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
              <MasinaKartica key={m.id} masina={m} />
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
