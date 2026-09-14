import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { SpisakJsonLd } from "@/components/SpisakJsonLd";
import { Plocica } from "@/components/Plocica";
import { MasinaKartica } from "@/components/MasinaKartica";
import {
  machineBranches,
  machineTypesForBranch,
  getMachinesByCategory,
  getMachinesByBranch,
  uzBroj,
  ogSlikaSpiska,
  drustveneSlike,
} from "@/lib/products";
import { GRANE, granaKljucevi, granaHref, type GranaKljuc } from "@/lib/masine";

/**
 * Jedna grana mašina — poljoprivredne, šumske ili građevinske.
 *
 * Postoji zasebno od `/masine` zato što su to tri različita kupca i tri
 * različita upita („poljoprivredne mašine", „mašine za šumu", „mini bager"). Sa
 * zajedničke strane bi svaki od njih dobio dve trećine ponude koja ga ne
 * zanima, a Google nijednu stranu kojoj je baš taj pojam u naslovu.
 *
 * DVA OBLIKA STRANE, po tome koliko mašina grana ima:
 *
 *  - MALA grana (šumske 18, građevinske 4) odmah nabraja SVE mašine, u mrežama
 *    razdvojenim po tipu. Pločica tipa je tu bila prazan korak: klik na
 *    „Iverači" vodi na stranu sa jednom mašinom, a klik na „Kružne pile" na
 *    stranu sa dve — kupac dva puta klikne da bi videlo ono što je moglo da
 *    stane na jedan ekran. Naslov tipa i dalje vodi na svoju stranu, pa se ne
 *    gubi ni unutrašnje povezivanje ni strana koja gađa upit „cepač drva".
 *
 *  - VELIKA grana (poljoprivredne, 53 mašine u 15 tipova) ostaje na pločicama.
 *    Tamo tip zaista sužava izbor, a spisak svih 53 kartice bio bi zid.
 *
 * Prag, a ne spisak imena grana: kad se ponuda šumskih mašina udvostruči, tip
 * ponovo postaje koristan korak i strana se sama vraća na pločice.
 */

/** Do koliko mašina grana pokazuje sve odjednom, bez koraka po tipovima. */
const SVE_ODJEDNOM_DO = 30;

const nadji = (kljuc: string) => machineBranches().find((g) => g.key === kljuc);

export function generateStaticParams() {
  return granaKljucevi.map((grana) => ({ grana }));
}

export function generateMetadata({ params }: { params: { grana: string } }): Metadata {
  const grana = nadji(params.grana);
  if (!grana) return {};

  const opis = `${grana.opis} Finansiranje, podrška oko subvencija i isporuka širom Srbije — zatražite ponudu, javljamo se isti dan.`;

  return {
    title: `${grana.label} — ${grana.count} ${uzBroj(grana.count, "mašina", "mašine", "mašina")}`,
    description: opis,
    alternates: { canonical: granaHref(grana.key as GranaKljuc) },
    keywords: [grana.label, grana.kratko, "mehanizacija", "PlugekS"],
    ...drustveneSlike({
      url: granaHref(grana.key as GranaKljuc),
      title: `${grana.label} | PlugekS`,
      description: opis,
      slika: ogSlikaSpiska(getMachinesByBranch(grana.key)),
    }),
  };
}

export default function GranaPage({ params }: { params: { grana: string } }) {
  const grana = nadji(params.grana);
  if (!grana) notFound();

  const tipovi = machineTypesForBranch(grana.key);
  const ostale = machineBranches().filter((g) => g.key !== grana.key);
  const sveOdjednom = grana.count <= SVE_ODJEDNOM_DO;
  const masine = sveOdjednom ? getMachinesByBranch(grana.key) : [];

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Mašine", href: "/masine" },
          { naziv: grana.label, href: granaHref(grana.key as GranaKljuc) },
        ]}
      />
      {/* Strana koja nabraja proizvode i pretraživaču se prijavljuje kao spisak
          proizvoda; ona sa pločicama tipova nije spisak, pa ga ni nema. */}
      {sveOdjednom ? <SpisakJsonLd naziv={grana.label} stavke={masine} /> : null}

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
            {sveOdjednom ? (
              <>
                {" "}
                Cela ponuda je ispod — {grana.count}{" "}
                {uzBroj(grana.count, "mašina", "mašine", "mašina")} u{" "}
                {tipovi.length} {uzBroj(tipovi.length, "grupi", "grupe", "grupa")}.
              </>
            ) : null}
          </p>

          {sveOdjednom ? (
            <div className="mt-8 space-y-10">
              {tipovi.map((tip) => (
                <div key={tip.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-3">
                    <h2 className="font-display text-lg font-bold text-charcoal md:text-xl">
                      <Link
                        href={`/masine/${tip.key}`}
                        className="transition-colors hover:text-brand"
                      >
                        {tip.label}
                      </Link>
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {tip.count} {uzBroj(tip.count, "model", "modela", "modela")}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                    {getMachinesByCategory(tip.key).map((m) => (
                      <MasinaKartica key={m.id} masina={m} nivo={3} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}

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
