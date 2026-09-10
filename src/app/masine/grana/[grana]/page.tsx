import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { Plocica } from "@/components/Plocica";
import {
  machineBranches,
  machineTypesForBranch,
  getMachinesByCategory,
  uzBroj,
} from "@/lib/products";
import { GRANE, granaKljucevi, granaHref, type GranaKljuc } from "@/lib/masine";

/**
 * Jedna grana mašina — poljoprivredne, šumske ili građevinske.
 *
 * Postoji zasebno od `/masine` zato što su to tri različita kupca i tri
 * različita upita („poljoprivredne mašine", „mašine za šumu", „mini bager"). Sa
 * zajedničke strane bi svaki od njih dobio dve trećine ponude koja ga ne
 * zanima, a Google nijednu stranu kojoj je baš taj pojam u naslovu.
 */

const nadji = (kljuc: string) => machineBranches().find((g) => g.key === kljuc);

export function generateStaticParams() {
  return granaKljucevi.map((grana) => ({ grana }));
}

export function generateMetadata({ params }: { params: { grana: string } }): Metadata {
  const grana = nadji(params.grana);
  if (!grana) return {};

  return {
    title: `${grana.label} — ${grana.count} ${uzBroj(grana.count, "mašina", "mašine", "mašina")}`,
    description: `${grana.opis} Finansiranje, podrška oko subvencija i isporuka širom Srbije — zatražite ponudu, javljamo se isti dan.`,
    alternates: { canonical: granaHref(grana.key as GranaKljuc) },
    keywords: [grana.label, grana.kratko, "mehanizacija", "PlugekS"],
  };
}

export default function GranaPage({ params }: { params: { grana: string } }) {
  const grana = nadji(params.grana);
  if (!grana) notFound();

  const tipovi = machineTypesForBranch(grana.key);
  const ostale = machineBranches().filter((g) => g.key !== grana.key);

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Mašine", href: "/masine" },
          { naziv: grana.label, href: granaHref(grana.key as GranaKljuc) },
        ]}
      />

      <section className="section bg-cream pt-28 md:pt-32">
        <div className="container">
          <Link
            href="/masine"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Sve mašine
          </Link>

          <h1 className="mt-4 font-display text-2xl font-bold text-charcoal md:text-3xl">
            {grana.label}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {grana.opis}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {tipovi.map((tip) => {
              const naslovna = getMachinesByCategory(tip.key)[0];
              return (
                <Plocica
                  key={tip.key}
                  href={`/masine/${tip.key}`}
                  naslov={tip.label}
                  broj={`${tip.count} ${uzBroj(tip.count, "mašina", "mašine", "mašina")}`}
                  slika={naslovna?.image}
                  alt={naslovna?.name ?? tip.label}
                />
              );
            })}
          </div>

          {ostale.length > 0 ? (
            <nav className="mt-14 border-t border-border pt-6">
              <p className="text-sm font-semibold text-charcoal">Ostale mašine</p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {ostale.map((g) => (
                  <li key={g.key}>
                    <Link
                      href={granaHref(g.key as GranaKljuc)}
                      className="text-brand hover:underline"
                    >
                      {GRANE[g.key as GranaKljuc].label}
                    </Link>{" "}
                    <span className="text-muted-foreground">({g.count})</span>
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
